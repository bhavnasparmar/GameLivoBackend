import http from 'http';
import { createApp } from './app.js';
import { initSocketServer } from './socket/socketServer.js';
import { connectDB } from './config/database.js';
import { getRedisClient } from './config/redis.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    // 1. Connect to MySQL Database
    await connectDB();

    // 2. Initialize Redis
    getRedisClient();

    // 3. Create Express app and HTTP server
    const app = createApp();
    const httpServer = http.createServer(app);

    // 4. Initialize Socket.io with HTTP server
    initSocketServer(httpServer);

    // 5. Start listening
    httpServer.listen(config.port, config.host, () => {
      logger.info(`=========================================`);
      console.log("server ruuning on ", config.port)
      // logger.info(`🎮 GameLivo Backend Server is RUNNING! 🚀`);
      // logger.info(`⚡ Environment: ${config.env}`);
      // logger.info(`📡 Server URL:  http://${config.host}:${config.port}`);
      // logger.info(`🌐 API URL:     ${config.apiUrl}`);
      // logger.info(`🔌 Socket URL:  ${config.socketUrl}`);
      // logger.info(`📱 Client URL:  ${config.clientUrl}`);
      // logger.info(`🛡️  CORS Origin: ${config.corsOrigin}`);
      // logger.info(`🔗 API Health:  http://${config.host}:${config.port}/api/v1/health`);
      logger.info(`=========================================`);
    });

    // Graceful Shutdown
    const gracefulShutdown = (signal: string) => {
      logger.warn(`Received ${signal}. Starting graceful shutdown...`);
      httpServer.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
