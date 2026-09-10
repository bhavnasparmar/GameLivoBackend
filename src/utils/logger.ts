import winston from 'winston';
import { config } from '../config/env.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const customFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    config.isDev ? colorize() : winston.format.json(),
    config.isDev ? customFormat : winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});
