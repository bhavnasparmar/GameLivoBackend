import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UserJWTPayload } from '../types/common.js';
import { ApiError } from './ApiError.js';

export function signAccessToken(payload: UserJWTPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): UserJWTPayload {
  try {
    return jwt.verify(token, config.jwt.secret) as UserJWTPayload;
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): { userId: string } {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
}
