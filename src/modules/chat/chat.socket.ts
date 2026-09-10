import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../types/socket.js';
import { SOCKET_EVENTS } from '../../constants/socketEvents.js';
import { ChatService } from './chat.service.js';
import { logger } from '../../utils/logger.js';

export function registerChatSocketHandlers(io: Server, socket: AuthenticatedSocket): void {
  // Join Chat Room
  socket.on(SOCKET_EVENTS.CHAT_JOIN_ROOM, (data: { roomId: string }) => {
    socket.join(`chat:${data.roomId}`);
    logger.debug(`[Socket] User ${socket.user?.username} joined chat room ${data.roomId}`);
  });

  // Leave Chat Room
  socket.on(SOCKET_EVENTS.CHAT_LEAVE_ROOM, (data: { roomId: string }) => {
    socket.leave(`chat:${data.roomId}`);
  });

  // Send Chat Message
  socket.on(SOCKET_EVENTS.CHAT_SEND_MESSAGE, async (data: {
    roomId: string;
    message: string;
    type?: 'text' | 'emoji' | 'system';
  }) => {
    try {
      const userId = socket.user?.userId;
      if (!userId || !data.message.trim()) return;

      const chatMessage = await ChatService.saveMessage({
        roomId: data.roomId,
        senderId: userId,
        message: data.message.trim(),
        type: data.type || 'text',
      });

      io.to(`chat:${data.roomId}`).emit(SOCKET_EVENTS.CHAT_NEW_MESSAGE, chatMessage);
    } catch (err) {
      logger.error('[Socket] CHAT_SEND_MESSAGE error:', err);
    }
  });

  // Typing Indicator
  socket.on(SOCKET_EVENTS.CHAT_TYPING, (data: { roomId: string; isTyping: boolean }) => {
    socket.to(`chat:${data.roomId}`).emit(SOCKET_EVENTS.CHAT_TYPING, {
      userId: socket.user?.userId,
      username: socket.user?.username,
      isTyping: data.isTyping,
    });
  });
}
