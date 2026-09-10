import { z } from 'zod';

export const createTicketSchema = z.object({
  category: z.enum(['gameplay', 'account', 'payment', 'bug', 'other']).default('other'),
  subject: z.string().min(3).max(100),
  message: z.string().min(10).max(2000),
});

export const reportPlayerSchema = z.object({
  reportedUserId: z.string().min(1),
  matchId: z.string().optional(),
  reason: z.enum(['cheating', 'abusive_chat', 'afk', 'inappropriate_name', 'other']),
  description: z.string().max(500).optional(),
});
