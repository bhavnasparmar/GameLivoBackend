import { z } from 'zod';

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  email: z.string().email().optional(),
  avatar: z.string().optional(),
  settings: z
    .object({
      soundEnabled: z.boolean().optional(),
      musicEnabled: z.boolean().optional(),
      vibrationEnabled: z.boolean().optional(),
      notificationsEnabled: z.boolean().optional(),
      language: z.string().optional(),
      theme: z.enum(['light', 'dark', 'system']).optional(),
    })
    .optional(),
});
