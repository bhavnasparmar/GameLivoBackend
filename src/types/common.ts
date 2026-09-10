export type GameId = 'ludo' | 'chess' | 'uno' | 'snakes_and_ladders' | 'chidiya_udd' | 'esto';

export type GameMode = 'quick' | 'classic' | 'tournament' | 'practice' | 'custom';

export type MatchStatus = 'waiting' | 'in_progress' | 'completed' | 'abandoned' | 'cancelled';

export interface UserJWTPayload {
  userId: string;
  phone?: string;
  email?: string;
  username: string;
  role: 'user' | 'admin' | 'moderator';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  docs: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
