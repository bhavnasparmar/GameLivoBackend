import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AuthenticatedSocket } from '../types/socket.js';
import { registerAllSocketHandlers } from './socketHandlers.js';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // JWT Authentication Middleware for WebSockets
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token;

    if (!token) {
      // Allow guest connections if needed, or enforce token
      logger.debug(`[Socket] Unauthenticated socket connected: ${socket.id}`);
      return next();
    }

    try {
      const payload = verifyAccessToken(token as string);
      socket.user = payload;
      next();
    } catch (err) {
      logger.warn(`[Socket] Auth failed for socket ${socket.id}`);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`[Socket] Connected: ${socket.id} (User: ${socket.user?.username || 'Guest'})`);
    registerAllSocketHandlers(io!, socket);
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io server not initialized');
  }
  return io;
}
