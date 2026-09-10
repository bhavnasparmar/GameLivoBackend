import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../types/socket.js';
import { SOCKET_EVENTS } from '../../constants/socketEvents.js';
import { Lobby } from './lobby.model.js';
import { MatchService } from '../match/match.service.js';
import { logger } from '../../utils/logger.js';

export function registerLobbySocketHandlers(io: Server, socket: AuthenticatedSocket): void {
  // Join Lobby Room
  socket.on(SOCKET_EVENTS.LOBBY_JOIN, async (data: { lobbyId: string }) => {
    try {
      const { lobbyId } = data;
      const userId = socket.user?.userId;
      if (!userId) return;

      const lobby = await Lobby.findByPk(lobbyId);
      if (!lobby) return;

      socket.lobbyId = lobbyId;
      socket.join(`lobby:${lobbyId}`);

      // Update player's socketId
      const players = (lobby.players || []).map((p) => {
        if (p.userId === userId) {
          return { ...p, socketId: socket.id };
        }
        return p;
      });
      lobby.players = players;
      lobby.changed('players', true);
      await lobby.save();

      io.to(`lobby:${lobbyId}`).emit(SOCKET_EVENTS.LOBBY_UPDATE, lobby);
      logger.debug(`[Socket] User ${socket.user?.username} joined lobby ${lobbyId}`);
    } catch (err) {
      logger.error('[Socket] LOBBY_JOIN error:', err);
    }
  });

  // Toggle Ready State
  socket.on(SOCKET_EVENTS.LOBBY_PLAYER_READY, async (data: { isReady: boolean }) => {
    try {
      const lobbyId = socket.lobbyId;
      const userId = socket.user?.userId;
      if (!lobbyId || !userId) return;

      const lobby = await Lobby.findByPk(lobbyId);
      if (!lobby) return;

      const players = (lobby.players || []).map((p) => {
        if (p.userId === userId) {
          return { ...p, isReady: data.isReady };
        }
        return p;
      });
      lobby.players = players;
      lobby.changed('players', true);
      await lobby.save();

      io.to(`lobby:${lobbyId}`).emit(SOCKET_EVENTS.LOBBY_UPDATE, lobby);
    } catch (err) {
      logger.error('[Socket] LOBBY_PLAYER_READY error:', err);
    }
  });

  // Start Game (Host only)
  socket.on(SOCKET_EVENTS.LOBBY_START_GAME, async () => {
    try {
      const lobbyId = socket.lobbyId;
      const userId = socket.user?.userId;
      if (!lobbyId || !userId) return;

      const lobby = await Lobby.findByPk(lobbyId);
      if (!lobby || lobby.hostId !== userId) return;

      if ((lobby.players || []).length < lobby.minPlayers) return;

      lobby.status = 'in_game';
      const match = await MatchService.createMatchFromLobby(lobby);
      lobby.currentMatchId = match.id;
      await lobby.save();

      // Notify all players in lobby that match has started
      io.to(`lobby:${lobbyId}`).emit(SOCKET_EVENTS.GAME_START, {
        matchId: match.id,
        gameId: match.gameId,
        match,
      });

      logger.info(`[Socket] Match started: ${match.id} for game ${match.gameId}`);
    } catch (err) {
      logger.error('[Socket] LOBBY_START_GAME error:', err);
    }
  });

  // Leave Lobby
  socket.on(SOCKET_EVENTS.LOBBY_LEAVE, async () => {
    try {
      const lobbyId = socket.lobbyId;
      const userId = socket.user?.userId;
      if (!lobbyId || !userId) return;

      socket.leave(`lobby:${lobbyId}`);
      socket.lobbyId = undefined;

      const lobby = await Lobby.findByPk(lobbyId);
      if (!lobby) return;

      const remainingPlayers = (lobby.players || []).filter((p) => p.userId !== userId);
      lobby.players = remainingPlayers;
      if (remainingPlayers.length === 0 || lobby.hostId === userId) {
        lobby.status = 'closed';
      }
      lobby.changed('players', true);
      await lobby.save();

      io.to(`lobby:${lobbyId}`).emit(SOCKET_EVENTS.LOBBY_UPDATE, lobby);
    } catch (err) {
      logger.error('[Socket] LOBBY_LEAVE error:', err);
    }
  });
}
