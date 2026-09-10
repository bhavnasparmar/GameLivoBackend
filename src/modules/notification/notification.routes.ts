import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', NotificationController.getNotifications);
router.put('/:id/read', NotificationController.markRead);
router.put('/read-all', NotificationController.markAllRead);

export default router;
