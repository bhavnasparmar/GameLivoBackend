import morgan from 'morgan';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

const stream = {
  write: (message: string) => logger.http ? logger.http(message.trim()) : logger.info(message.trim()),
};

export const httpLogger = morgan(
  config.isDev ? ':method :url :status :response-time ms - :res[content-length]' : 'combined',
  { stream }
);
