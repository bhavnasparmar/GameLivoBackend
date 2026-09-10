import { UserJWTPayload } from './common.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserJWTPayload;
    }
  }
}

export {};
