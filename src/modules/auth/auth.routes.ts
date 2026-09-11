import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authLimiter } from '../../middleware/rateLimit.middleware.js';
import {
  registerSchema,
  loginPasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
  verifyRegistrationOtpSchema,
  refreshTokenSchema,
} from './auth.validation.js';

const router = Router();

router.use(authLimiter);

router.post('/otp/send', validate({ body: sendOtpSchema }), AuthController.sendOtp);
router.post('/otp/verify', validate({ body: verifyOtpSchema }), AuthController.verifyOtp);
router.post('/register', validate({ body: registerSchema }), AuthController.register);
router.post('/register/verify-otp', validate({ body: verifyRegistrationOtpSchema }), AuthController.verifyRegistrationOtp);
router.post('/login', validate({ body: loginPasswordSchema }), AuthController.login);
router.post('/refresh', validate({ body: refreshTokenSchema }), AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);

export default router;
