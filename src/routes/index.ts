import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/user/user.routes.js';
import gameRoutes from '../modules/game/game.routes.js';
import lobbyRoutes from '../modules/lobby/lobby.routes.js';
import matchRoutes from '../modules/match/match.routes.js';
import friendsRoutes from '../modules/friends/friends.routes.js';
import chatRoutes from '../modules/chat/chat.routes.js';
import notificationRoutes from '../modules/notification/notification.routes.js';
import rewardRoutes from '../modules/reward/reward.routes.js';
import leaderboardRoutes from '../modules/leaderboard/leaderboard.routes.js';
import supportRoutes from '../modules/support/support.routes.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'GameLivo API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Feature routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/games', gameRoutes);
router.use('/lobby', lobbyRoutes);
router.use('/match', matchRoutes);
router.use('/friends', friendsRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/rewards', rewardRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/support', supportRoutes);

export default router;
