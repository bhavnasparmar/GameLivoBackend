import { z } from 'zod';

export const createLobbySchema = z.object({
  gameId: z.enum(['ludo', 'chess', 'uno', 'snakes_and_ladders', 'chidiya_udd', 'esto']),
  mode: z.string().default('classic'),
  maxPlayers: z.number().min(2).max(4).default(4),
  entryFee: z.number().min(0).default(0),
  isPrivate: z.boolean().default(false),
});

export const joinLobbySchema = z.object({
  code: z.string().min(4).max(8),
});
