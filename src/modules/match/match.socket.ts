import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../types/socket.js';
import { SOCKET_EVENTS } from '../../constants/socketEvents.js';
import { Match } from './match.model.js';
import { MatchService } from './match.service.js';
import { logger } from '../../utils/logger.js';

export function registerMatchSocketHandlers(io: Server, socket: AuthenticatedSocket): void {
  // Join Match Room
  socket.on(SOCKET_EVENTS.GAME_STATE, async (data: { matchId: string }) => {
    try {
      const { matchId } = data;
      const userId = socket.user?.userId;
      if (!userId) return;

      const match = await Match.findByPk(matchId);
      if (!match) return;

      socket.matchId = matchId;
      socket.join(`match:${matchId}`);

      socket.emit(SOCKET_EVENTS.GAME_STATE, match);
      logger.debug(`[Socket] User ${socket.user?.username} joined match ${matchId}`);
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

      // Ensure it's user's turn
      if (match.currentTurnUserId && match.currentTurnUserId !== userId) {
        return;
      }

      const diceValue = Math.floor(Math.random() * 6) + 1;

      // Update match gameState
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

  // Make Game Move / Action
  socket.on(SOCKET_EVENTS.GAME_MOVE, async (data: { matchId: string; moveData: any }) => {
    try {
      const { matchId, moveData } = data;
      const userId = socket.user?.userId;
      if (!userId) return;

      const match = await Match.findByPk(matchId);
      if (!match || match.status !== 'in_progress') return;

      // Update game state with move
      match.gameState = {
        ...(match.gameState || {}),
        ...moveData,
        lastMoveBy: userId,
        lastMoveAt: new Date(),
      };
      match.changed('gameState', true);

      // Rotate turn to next player if applicable
      const playerIds = (match.players || []).map((p) => p.userId);
      const currentIndex = playerIds.indexOf(userId);
      if (currentIndex !== -1 && playerIds.length > 1) {
        const nextIndex = (currentIndex + 1) % playerIds.length;
        match.currentTurnUserId = playerIds[nextIndex];
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
  socket.on(SOCKET_EVENTS.GAME_OVER, async (data: { matchId: string; winnerId: string; scores?: any }) => {
    try {
      const { matchId, winnerId, scores } = data;
      const match = await MatchService.endMatch(matchId, winnerId, scores);

      io.to(`match:${matchId}`).emit(SOCKET_EVENTS.GAME_OVER, {
        winnerId,
        match,
      });

      logger.info(`[Socket] Match ${matchId} completed. Winner: ${winnerId}`);
    } catch (err) {
      logger.error('[Socket] GAME_OVER error:', err);
    }
  });
}
