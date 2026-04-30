import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.schemas';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post('/logout', requireAuth, authController.logout);
router.patch('/change-password', requireAuth, validate(changePasswordSchema), authController.changePassword);

export default router;
