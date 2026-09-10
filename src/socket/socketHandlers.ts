import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../types/socket.js';
import { registerLobbySocketHandlers } from '../modules/lobby/lobby.socket.js';
import { registerMatchSocketHandlers } from '../modules/match/match.socket.js';
import { registerChatSocketHandlers } from '../modules/chat/chat.socket.js';
import { User } from '../modules/user/user.model.js';
import { logger } from '../utils/logger.js';

export function registerAllSocketHandlers(io: Server, socket: AuthenticatedSocket): void {
  // Update User Online status
  if (socket.user?.userId) {
    User.update(
      { isOnline: true, lastActive: new Date() },
      { where: { id: socket.user.userId } }
    ).catch((err) => logger.error('Error updating user online status:', err));
  }

  // Register modular socket event listeners
  registerLobbySocketHandlers(io, socket);
  registerMatchSocketHandlers(io, socket);
  registerChatSocketHandlers(io, socket);

  // Handle Disconnect
  socket.on('disconnect', async (reason) => {
    logger.info(`[Socket] User ${socket.user?.username || socket.id} disconnected: ${reason}`);

    if (socket.user?.userId) {
      await User.update(
        { isOnline: false, lastActive: new Date() },
        { where: { id: socket.user.userId } }
      ).catch((err) => logger.error('Error updating user offline status:', err));
    }
  });
}
