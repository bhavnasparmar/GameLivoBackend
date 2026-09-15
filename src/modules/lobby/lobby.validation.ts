import { z } from 'zod';

export const createLobbySchema = z.object({
  gameId: z.enum(['ludo', 'chess', 'uno', 'snakes_and_ladders', 'chidiya_udd', 'esto']),
  mode: z.string().optional().default('classic'),
  maxPlayers: z.number().int().min(2).max(4).optional().default(2),
  entryFee: z.number().int().min(0).optional().default(0),
  isPrivate: z.boolean().optional().default(true),
  timeSeconds: z.number().int().min(30).max(3600).optional().default(300),
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{4,8}$/, 'Room code must be 4-8 alphanumeric characters')
    .optional(),
});

export const joinLobbySchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, 'Room code must be at least 4 characters')
    .max(8, 'Room code must not exceed 8 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Room code must contain only letters and numbers'),
});
