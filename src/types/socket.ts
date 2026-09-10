import { Socket } from 'socket.io';
import { UserJWTPayload } from './common.js';

export interface AuthenticatedSocket extends Socket {
  user?: UserJWTPayload;
  lobbyId?: string;
  matchId?: string;
}

export interface SocketPlayerInfo {
  userId: string;
  username: string;
  avatar?: string;
  socketId: string;
  isReady: boolean;
  score: number;
  seatIndex: number;
}
