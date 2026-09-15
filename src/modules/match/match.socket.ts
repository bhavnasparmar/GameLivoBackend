import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../types/socket.js';
import { SOCKET_EVENTS } from '../../constants/socketEvents.js';
import { Match } from './match.model.js';
import { MatchService } from './match.service.js';
import { logger } from '../../utils/logger.js';

interface IQueuedPlayer {
  socketId: string;
  socket: AuthenticatedSocket;
  user: {
    userId: string;
    username: string;
    avatar: string;
    rating?: number;
  };
  gameId: string;
  timeSeconds: number;
  entryFee: number;
  joinedAt: number;
  timer?: NodeJS.Timeout;
}

// In-memory matchmaking queue per game
const matchmakingQueues = new Map<string, IQueuedPlayer[]>();

const BOT_NAMES = [
  'Vikram Sharma',
  'Aarav Patel',
  'Ananya Gupta',
  'Rohan Mehta',
  'Aditya Rao',
  'Sneha Iyer',
  'Kavya Deshmukh',
  'Aryan Nair',
];

function getRandomBot(rating = 1420) {
  const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  const botRating = rating + Math.floor(Math.random() * 80 - 40);
  return {
    userId: `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    username: name,
    avatar: '',
    rating: botRating,
    isBot: true,
  };
}

function removeFromQueue(socketId: string) {
  for (const [gameId, queue] of matchmakingQueues.entries()) {
    const idx = queue.findIndex((p) => p.socketId === socketId);
    if (idx !== -1) {
      const [removed] = queue.splice(idx, 1);
      if (removed.timer) {
        clearTimeout(removed.timer);
      }
      logger.info(`[Matchmaking] Removed user ${removed.user.username} (${socketId}) from ${gameId} queue`);
    }
  }
}

export function registerMatchSocketHandlers(io: Server, socket: AuthenticatedSocket): void {
  // Join Matchmaking Queue (Quick Match)
  socket.on(
    SOCKET_EVENTS.MATCH_QUEUE_JOIN,
    async (data: { gameId?: string; timeSeconds?: number; entryFee?: number }) => {
      try {
        const gameId = data?.gameId || 'chess';
        const timeSeconds = data?.timeSeconds || 300;
        const entryFee = data?.entryFee || 0;

        const userId = socket.user?.userId || `guest_${socket.id.substring(0, 6)}`;
        const username = socket.user?.username || `Player_${socket.id.substring(0, 4)}`;
        const avatar = (socket.user as any)?.avatar || '';

        // Clean up any existing queue entries for this socket
        removeFromQueue(socket.id);

        if (!matchmakingQueues.has(gameId)) {
          matchmakingQueues.set(gameId, []);
        }
        const queue = matchmakingQueues.get(gameId)!;

        // Check if there is an opponent already waiting in queue
        const opponentIdx = queue.findIndex((p) => p.user.userId !== userId);

        if (opponentIdx !== -1) {
          // Pair found!
          const [opponent] = queue.splice(opponentIdx, 1);
          if (opponent.timer) {
            clearTimeout(opponent.timer);
          }

          const isCurrentWhite = Math.random() < 0.5;
          const whitePlayer = isCurrentWhite
            ? { userId, username, avatar, rating: 1420 }
            : opponent.user;
          const blackPlayer = isCurrentWhite
            ? opponent.user
            : { userId, username, avatar, rating: 1420 };

          const match = await MatchService.createMatchFromQueue(
            gameId,
            [whitePlayer, blackPlayer],
            timeSeconds,
            entryFee
          );

          socket.matchId = match.id;
          opponent.socket.matchId = match.id;

          socket.join(`match:${match.id}`);
          opponent.socket.join(`match:${match.id}`);

          const matchPayload = {
            matchId: match.id,
            gameId: match.gameId,
            mode: 'quick_match',
            players: match.players,
            whitePlayer: match.players[0],
            blackPlayer: match.players[1],
            currentTurnUserId: match.currentTurnUserId,
            gameState: match.gameState,
            timeSeconds,
            startedAt: match.startedAt,
          };

          io.to(`match:${match.id}`).emit(SOCKET_EVENTS.MATCH_FOUND, matchPayload);
          io.to(`match:${match.id}`).emit(SOCKET_EVENTS.GAME_START, matchPayload);

          logger.info(`[Matchmaking] Paired real players ${username} vs ${opponent.user.username} in match ${match.id}`);
        } else {
          // No waiting human player: add to queue with fallback timer
          const queuedPlayer: IQueuedPlayer = {
            socketId: socket.id,
            socket,
            user: { userId, username, avatar, rating: 1420 },
            gameId,
            timeSeconds,
            entryFee,
            joinedAt: Date.now(),
          };

          // Fallback: If no human joins within 5 seconds, match with simulated opponent
          queuedPlayer.timer = setTimeout(async () => {
            const currentQueue = matchmakingQueues.get(gameId);
            if (!currentQueue) return;
            const selfIdx = currentQueue.findIndex((p) => p.socketId === socket.id);
            if (selfIdx === -1) return;

            currentQueue.splice(selfIdx, 1);

            const botOpponent = getRandomBot(1420);
            const isUserWhite = Math.random() < 0.5;
            const whitePlayer = isUserWhite
              ? queuedPlayer.user
              : botOpponent;
            const blackPlayer = isUserWhite
              ? botOpponent
              : queuedPlayer.user;

            const match = await MatchService.createMatchFromQueue(
              gameId,
              [whitePlayer, blackPlayer],
              timeSeconds,
              entryFee
            );

            socket.matchId = match.id;
            socket.join(`match:${match.id}`);

            const matchPayload = {
              matchId: match.id,
              gameId: match.gameId,
              mode: 'quick_match',
              players: match.players,
              whitePlayer: match.players[0],
              blackPlayer: match.players[1],
              currentTurnUserId: match.currentTurnUserId,
              gameState: match.gameState,
              timeSeconds,
              startedAt: match.startedAt,
            };

            socket.emit(SOCKET_EVENTS.MATCH_FOUND, matchPayload);
            socket.emit(SOCKET_EVENTS.GAME_START, matchPayload);

            logger.info(`[Matchmaking] Matched ${username} with ${botOpponent.username} in match ${match.id}`);
          }, 4500);

          queue.push(queuedPlayer);
          logger.info(`[Matchmaking] User ${username} queued for ${gameId} (${timeSeconds}s)`);
        }
      } catch (err) {
        logger.error('[Socket] MATCH_QUEUE_JOIN error:', err);
      }
    }
  );

  // Leave Matchmaking Queue
  socket.on(SOCKET_EVENTS.MATCH_QUEUE_LEAVE, () => {
    removeFromQueue(socket.id);
  });

  // Join Match Room / Fetch State
  socket.on(SOCKET_EVENTS.GAME_STATE, async (data: { matchId: string }) => {
    try {
      const { matchId } = data;
      if (!matchId) return;

      const match = await Match.findByPk(matchId);
      if (!match) return;

      socket.matchId = matchId;
      socket.join(`match:${matchId}`);

      socket.emit(SOCKET_EVENTS.GAME_STATE, match);
      logger.debug(`[Socket] User ${socket.user?.username || socket.id} joined match ${matchId}`);
    } catch (err) {
      logger.error('[Socket] GAME_STATE fetch error:', err);
    }
  });

  // Roll Dice (Ludo, Snakes & Ladders, Esto)
  socket.on(SOCKET_EVENTS.GAME_DICE_ROLL, async (data: { matchId: string }) => {
    try {
      const { matchId } = data;
      const userId = socket.user?.userId;
      if (!userId) return;

      const match = await Match.findByPk(matchId);
      if (!match || match.status !== 'in_progress') return;

      if (match.currentTurnUserId && match.currentTurnUserId !== userId) {
        return;
      }

      const diceValue = Math.floor(Math.random() * 6) + 1;

      match.gameState = {
        ...(match.gameState || {}),
        lastDice: diceValue,
        canRoll: false,
      };
      match.changed('gameState', true);
      await match.save();

      io.to(`match:${matchId}`).emit(SOCKET_EVENTS.GAME_DICE_ROLLED, {
        userId,
        diceValue,
        match,
      });
    } catch (err) {
      logger.error('[Socket] GAME_DICE_ROLL error:', err);
    }
  });

  // Make Game Move / Action (Chess, Ludo, Uno)
  socket.on(SOCKET_EVENTS.GAME_MOVE, async (data: { matchId: string; moveData: any }) => {
    try {
      const { matchId, moveData } = data;
      const userId = socket.user?.userId || data.moveData?.userId || socket.id;

      const match = await Match.findByPk(matchId);
      if (!match || match.status !== 'in_progress') return;

      // Update game state with move
      const currentGameState = match.gameState || {};
      const updatedGameState = {
        ...currentGameState,
        ...moveData,
        lastMoveBy: userId,
        lastMoveAt: new Date(),
      };

      match.gameState = updatedGameState;
      match.changed('gameState', true);

      // Rotate turn to next player
      const players = match.players || [];
      const playerIds = players.map((p) => p.userId);
      const currentIndex = playerIds.indexOf(userId);

      if (currentIndex !== -1 && playerIds.length > 1) {
        const nextIndex = (currentIndex + 1) % playerIds.length;
        match.currentTurnUserId = playerIds[nextIndex];
      } else if (players.length === 2) {
        // Fallback for 2-player game
        match.currentTurnUserId =
          match.currentTurnUserId === players[0]?.userId
            ? players[1]?.userId
            : players[0]?.userId;
      }

      await match.save();

      io.to(`match:${matchId}`).emit(SOCKET_EVENTS.GAME_MOVE, {
        userId,
        moveData,
        nextTurnUserId: match.currentTurnUserId,
        gameState: match.gameState,
      });
    } catch (err) {
      logger.error('[Socket] GAME_MOVE error:', err);
    }
  });

  // Offer Draw (Chess)
  socket.on(SOCKET_EVENTS.MATCH_DRAW_OFFER, (data: { matchId: string }) => {
    const { matchId } = data;
    const userId = socket.user?.userId || socket.id;
    socket.to(`match:${matchId}`).emit(SOCKET_EVENTS.MATCH_DRAW_OFFER, {
      userId,
      username: socket.user?.username || 'Opponent',
    });
  });

  // Draw Response (Accept / Decline)
  socket.on(
    SOCKET_EVENTS.MATCH_DRAW_RESPONSE,
    async (data: { matchId: string; accepted: boolean }) => {
      try {
        const { matchId, accepted } = data;
        const userId = socket.user?.userId || socket.id;

        if (accepted) {
          const match = await MatchService.endMatch(matchId, 'draw');
          io.to(`match:${matchId}`).emit(SOCKET_EVENTS.GAME_OVER, {
            winnerId: 'draw',
            match,
            reason: 'Draw agreed by both players 🤝',
          });
        } else {
          socket.to(`match:${matchId}`).emit(SOCKET_EVENTS.MATCH_DRAW_RESPONSE, {
            accepted: false,
            userId,
          });
        }
      } catch (err) {
        logger.error('[Socket] MATCH_DRAW_RESPONSE error:', err);
      }
    }
  );

  // Resign Match (Chess)
  socket.on(SOCKET_EVENTS.MATCH_RESIGN, async (data: { matchId: string }) => {
    try {
      const { matchId } = data;
      const userId = socket.user?.userId || socket.id;

      const match = await Match.findByPk(matchId);
      if (!match || match.status !== 'in_progress') return;

      const opponent = (match.players || []).find((p) => p.userId !== userId);
      const winnerId = opponent?.userId || 'unknown';

      const updatedMatch = await MatchService.endMatch(matchId, winnerId);

      io.to(`match:${matchId}`).emit(SOCKET_EVENTS.GAME_OVER, {
        winnerId,
        match: updatedMatch,
        reason: `${socket.user?.username || 'Player'} resigned`,
      });
    } catch (err) {
      logger.error('[Socket] MATCH_RESIGN error:', err);
    }
  });

  // Game Emote / Reaction
  socket.on(SOCKET_EVENTS.GAME_EMOTE, (data: { matchId: string; emoteId: string }) => {
    const { matchId, emoteId } = data;
    io.to(`match:${matchId}`).emit(SOCKET_EVENTS.GAME_EMOTE, {
      userId: socket.user?.userId,
      username: socket.user?.username,
      emoteId,
    });
  });

  // Game Over Trigger
  socket.on(
    SOCKET_EVENTS.GAME_OVER,
    async (data: { matchId: string; winnerId: string; scores?: any; reason?: string }) => {
      try {
        const { matchId, winnerId, scores, reason } = data;
        const match = await MatchService.endMatch(matchId, winnerId, scores);

        io.to(`match:${matchId}`).emit(SOCKET_EVENTS.GAME_OVER, {
          winnerId,
          match,
          reason,
        });

        logger.info(`[Socket] Match ${matchId} completed. Winner: ${winnerId}`);
      } catch (err) {
        logger.error('[Socket] GAME_OVER error:', err);
      }
    }
  );

  // Handle Disconnection cleanup
  socket.on('disconnect', () => {
    removeFromQueue(socket.id);
    if (socket.matchId) {
      socket.to(`match:${socket.matchId}`).emit(SOCKET_EVENTS.PLAYER_DISCONNECTED, {
        userId: socket.user?.userId || socket.id,
        username: socket.user?.username,
      });
    }
  });
}
