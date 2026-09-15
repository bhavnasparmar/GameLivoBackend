import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../types/socket.js';
import { SOCKET_EVENTS } from '../../constants/socketEvents.js';
import { Lobby, ILobbyPlayer } from './lobby.model.js';
import { MatchService } from '../match/match.service.js';
import { User } from '../user/user.model.js';
import { logger } from '../../utils/logger.js';

export function registerLobbySocketHandlers(io: Server, socket: AuthenticatedSocket): void {
  // Create / Host Lobby Room
  socket.on(
    SOCKET_EVENTS.LOBBY_CREATE,
    async (data: {
      gameId?: string;
      code?: string;
      mode?: string;
      maxPlayers?: number;
      entryFee?: number;
      isPrivate?: boolean;
      timeSeconds?: number;
    }) => {
      try {
        const userId = socket.user?.userId || socket.id;
        const username = socket.user?.username || 'Host';
        const gameId = data.gameId || 'chess';

        let roomCode = data.code ? data.code.trim().toUpperCase() : '';
        if (!roomCode || !/^[A-Za-z0-9]{4,8}$/.test(roomCode)) {
          roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        }

        let userRecord = null;
        if (socket.user?.userId) {
          userRecord = await User.findByPk(socket.user.userId);
        }

        // Check if lobby with code already exists and is waiting
        let existingLobby = await Lobby.findOne({
          where: { code: roomCode, status: 'waiting' },
        });

        if (existingLobby && existingLobby.hostId !== userId) {
          // Generate a fresh unique room code if conflict
          roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        }

        const hostPlayer: ILobbyPlayer = {
          userId,
          username: userRecord?.username || username,
          avatar: userRecord?.avatar || '',
          seatIndex: 0,
          isReady: true,
          isHost: true,
          socketId: socket.id,
          joinedAt: new Date(),
        };

        const lobby = await Lobby.create({
          code: roomCode,
          gameId,
          mode: data.mode || 'private',
          hostId: userId,
          maxPlayers: Math.min(4, Math.max(2, data.maxPlayers || 2)),
          minPlayers: 2,
          entryFee: Math.max(0, data.entryFee || 0),
          prizePool: 0,
          isPrivate: data.isPrivate ?? true,
          status: 'waiting',
          players: [hostPlayer],
        });

        socket.lobbyId = lobby.id;
        socket.join(`lobby:${lobby.id}`);
        socket.join(`lobby:${roomCode}`);

        socket.emit(SOCKET_EVENTS.LOBBY_UPDATE, lobby);
        logger.info(`[LobbySocket] Lobby created #${roomCode} (ID: ${lobby.id}) by ${username}`);
      } catch (err) {
        logger.error('[LobbySocket] LOBBY_CREATE error:', err);
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to create lobby room.' });
      }
    }
  );

  // Join Lobby Room (by ID or Room Code) with Validations
  socket.on(
    SOCKET_EVENTS.LOBBY_JOIN,
    async (data: { lobbyId?: string; code?: string; timeSeconds?: number }) => {
      try {
        const { lobbyId, code } = data;
        const userId = socket.user?.userId || socket.id;
        const username = socket.user?.username || 'Player';

        // 1. Validation: code or lobbyId must be provided
        if (!lobbyId && (!code || typeof code !== 'string' || code.trim().length < 4)) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Please enter a valid 4-8 character room code.' });
          return;
        }

        let lobby = null;
        if (lobbyId) {
          lobby = await Lobby.findByPk(lobbyId);
        } else if (code) {
          const cleanCode = code.trim().toUpperCase();
          lobby = await Lobby.findOne({
            where: { code: cleanCode },
          });
        }

        // 2. Validation: check lobby exists
        if (!lobby) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Room not found. Please check the code and try again.' });
          return;
        }

        // 3. Validation: check lobby status
        if (lobby.status === 'in_game') {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'This match is already in progress.' });
          return;
        }

        if (lobby.status === 'closed') {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'This room has been closed by the host.' });
          return;
        }

        // 4. Validation: check room capacity
        const currentPlayers = lobby.players || [];
        const isAlreadyInRoom = currentPlayers.some((p) => p.userId === userId);

        if (!isAlreadyInRoom && currentPlayers.length >= lobby.maxPlayers) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'This room is already full (2/2 players).' });
          return;
        }

        let userRecord = null;
        if (socket.user?.userId) {
          userRecord = await User.findByPk(socket.user.userId);
        }

        socket.lobbyId = lobby.id;
        socket.join(`lobby:${lobby.id}`);
        socket.join(`lobby:${lobby.code}`);

        if (!isAlreadyInRoom) {
          const newPlayer: ILobbyPlayer = {
            userId,
            username: userRecord?.username || username,
            avatar: userRecord?.avatar || '',
            seatIndex: currentPlayers.length,
            isReady: true,
            isHost: lobby.hostId === userId,
            socketId: socket.id,
            joinedAt: new Date(),
          };
          lobby.players = [...currentPlayers, newPlayer];
        } else {
          lobby.players = currentPlayers.map((p) =>
            p.userId === userId ? { ...p, socketId: socket.id, isReady: true } : p
          );
        }

        lobby.changed('players', true);
        await lobby.save();

        io.to(`lobby:${lobby.id}`).emit(SOCKET_EVENTS.LOBBY_UPDATE, lobby);
        io.to(`lobby:${lobby.code}`).emit(SOCKET_EVENTS.LOBBY_UPDATE, lobby);

        logger.info(`[LobbySocket] User ${username} joined lobby #${lobby.code} (${lobby.id})`);
      } catch (err) {
        logger.error('[LobbySocket] LOBBY_JOIN error:', err);
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'An error occurred while joining the room.' });
      }
    }
  );

  // Toggle Ready State
  socket.on(SOCKET_EVENTS.LOBBY_PLAYER_READY, async (data: { isReady: boolean }) => {
    try {
      const lobbyId = socket.lobbyId;
      const userId = socket.user?.userId || socket.id;
      if (!lobbyId) return;

      const lobby = await Lobby.findByPk(lobbyId);
      if (!lobby) return;

      const players = (lobby.players || []).map((p) => {
        if (p.userId === userId) {
          return { ...p, isReady: Boolean(data?.isReady) };
        }
        return p;
      });
      lobby.players = players;
      lobby.changed('players', true);
      await lobby.save();

      io.to(`lobby:${lobby.id}`).emit(SOCKET_EVENTS.LOBBY_UPDATE, lobby);
      if (lobby.code) {
        io.to(`lobby:${lobby.code}`).emit(SOCKET_EVENTS.LOBBY_UPDATE, lobby);
      }
    } catch (err) {
      logger.error('[LobbySocket] LOBBY_PLAYER_READY error:', err);
    }
  });

  // Start Game with Validations
  socket.on(
    SOCKET_EVENTS.LOBBY_START_GAME,
    async (data?: { timeSeconds?: number }) => {
      try {
        const lobbyId = socket.lobbyId;
        const userId = socket.user?.userId || socket.id;
        if (!lobbyId) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'No active room found.' });
          return;
        }

        const lobby = await Lobby.findByPk(lobbyId);
        if (!lobby) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Lobby room not found.' });
          return;
        }

        // 1. Validation: only host can start
        if (lobby.hostId !== userId) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Only the host can start the match.' });
          return;
        }

        // 2. Validation: player count
        const players = lobby.players || [];
        if (players.length < 2) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Waiting for 2nd player to join the room.' });
          return;
        }

        lobby.status = 'in_game';
        const validTime = Math.max(30, Math.min(3600, Number(data?.timeSeconds) || 300));

        const match = await MatchService.createMatchFromLobby({
          ...lobby.toJSON(),
          timeSeconds: validTime,
        });

        lobby.currentMatchId = match.id;
        await lobby.save();

        const matchPayload = {
          matchId: match.id,
          gameId: match.gameId,
          mode: 'private',
          players: match.players,
          whitePlayer: match.players[0],
          blackPlayer: match.players[1],
          currentTurnUserId: match.currentTurnUserId,
          gameState: match.gameState,
          timeSeconds: validTime,
          startedAt: match.startedAt,
        };

        // Broadcast to both players in the lobby
        io.to(`lobby:${lobby.id}`).emit(SOCKET_EVENTS.GAME_START, matchPayload);
        if (lobby.code) {
          io.to(`lobby:${lobby.code}`).emit(SOCKET_EVENTS.GAME_START, matchPayload);
        }

        logger.info(`[LobbySocket] Match started: ${match.id} for lobby #${lobby.code}`);
      } catch (err) {
        logger.error('[LobbySocket] LOBBY_START_GAME error:', err);
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to start the match.' });
      }
    }
  );

  // Leave Lobby
  socket.on(SOCKET_EVENTS.LOBBY_LEAVE, async () => {
    try {
      const lobbyId = socket.lobbyId;
      const userId = socket.user?.userId || socket.id;
      if (!lobbyId) return;

      const lobby = await Lobby.findByPk(lobbyId);
      socket.leave(`lobby:${lobbyId}`);
      if (lobby?.code) {
        socket.leave(`lobby:${lobby.code}`);
      }
      socket.lobbyId = undefined;

      if (!lobby) return;

      const remainingPlayers = (lobby.players || []).filter((p) => p.userId !== userId);
      lobby.players = remainingPlayers;
      if (remainingPlayers.length === 0 || lobby.hostId === userId) {
        lobby.status = 'closed';
      }
      lobby.changed('players', true);
      await lobby.save();

      io.to(`lobby:${lobby.id}`).emit(SOCKET_EVENTS.LOBBY_UPDATE, lobby);
      if (lobby.code) {
        io.to(`lobby:${lobby.code}`).emit(SOCKET_EVENTS.LOBBY_UPDATE, lobby);
      }
    } catch (err) {
      logger.error('[LobbySocket] LOBBY_LEAVE error:', err);
    }
  });
}
