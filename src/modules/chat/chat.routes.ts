import { Router } from 'express';
import { ChatController } from './chat.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/:roomId', ChatController.getMessages);

export default router;
