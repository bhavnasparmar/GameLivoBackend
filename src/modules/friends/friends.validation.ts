import { z } from 'zod';

export const sendFriendRequestSchema = z.object({
  receiverId: z.string().min(1, 'Target user ID is required'),
});
