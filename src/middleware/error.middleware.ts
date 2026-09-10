import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  logger.error(`[${req.method}] ${req.originalUrl} - ${error.statusCode} - ${error.message}`, {
    stack: error.stack,
    errors: error.errors,
  });

  const response: Record<string, any> = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors?.length ? error.errors : undefined,
    timestamp: new Date().toISOString(),
  };

  if (config.isDev) {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
