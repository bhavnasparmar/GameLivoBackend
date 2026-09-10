import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config/env.js';
import { httpLogger } from './middleware/logger.middleware.js';
import { globalLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import apiRouter from './routes/index.js';

export function createApp(): Application {
  const app = express();

  // Security & standard headers
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin,
      credentials: true,
    })
  );

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging & rate limiting
  app.use(httpLogger);
  app.use('/api', globalLimiter);

  // Static uploads directory
  app.use('/uploads', express.static(path.resolve(process.cwd(), config.upload.dir)));

  // Root welcome
  app.get('/', (_req, res) => {
    res.json({
      name: 'GameLivo API Server',
      version: '1.0.0',
      status: 'active',
      documentation: '/api/v1/health',
    });
  });

  // Mount API v1
  app.use('/api/v1', apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
