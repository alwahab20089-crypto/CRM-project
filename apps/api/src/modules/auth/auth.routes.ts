import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCsrfHeader } from '../../middleware/csrf';
import type { RateLimiters } from '../../middleware/rate-limit';
import { validate } from '../../middleware/validate';
import * as controller from './auth.controller';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from './auth.validation';

export function createAuthRouter(limiters: RateLimiters) {
  const router = Router();
  const { auth, loginAccount } = limiters;

  router.post('/register', auth, validate({ body: registerSchema }), controller.register);
  router.post('/login', auth, loginAccount, validate({ body: loginSchema }), controller.login);
  router.post('/refresh', auth, requireCsrfHeader, controller.refresh);
  router.post('/logout', requireCsrfHeader, controller.logout);
  router.post('/logout-all', authenticate, controller.logoutAll);
  router.post('/forgot-password', auth, validate({ body: forgotPasswordSchema }), controller.forgotPassword);
  router.post('/reset-password', auth, validate({ body: resetPasswordSchema }), controller.resetPassword);
  router.get('/me', authenticate, controller.me);

  return router;
}