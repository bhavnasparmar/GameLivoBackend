import { Router } from 'express';
import { RewardController } from './reward.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/daily', RewardController.getDailyStatus);
router.post('/daily/claim', RewardController.claimDaily);
router.get('/referral', RewardController.getReferral);
router.get('/transactions', RewardController.getTransactions);

export default router;
