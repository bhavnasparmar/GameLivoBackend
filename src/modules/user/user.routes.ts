import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { updateProfileSchema } from './user.validation.js';

const router = Router();

router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.put('/profile', validate({ body: updateProfileSchema }), UserController.updateProfile);
router.get('/stats', UserController.getStats);

export default router;
