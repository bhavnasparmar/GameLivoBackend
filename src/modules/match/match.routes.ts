import { Router } from 'express';
import { MatchController } from './match.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/history', MatchController.getHistory);
router.get('/:matchId', MatchController.getById);

export default router;
