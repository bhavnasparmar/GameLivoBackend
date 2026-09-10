import { Router } from 'express';
import { LeaderboardController } from './leaderboard.controller.js';
import { optionalAuth, authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/global', optionalAuth, LeaderboardController.getGlobal);
router.get('/friends', authenticate, LeaderboardController.getFriends);
router.get('/:gameId', optionalAuth, LeaderboardController.getByGame);

export default router;
