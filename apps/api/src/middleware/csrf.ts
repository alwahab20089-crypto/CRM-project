import type { RequestHandler } from 'express';
import { allowedOrigins } from '../config/cors';
import { AppError } from '../utils/app-error';

/**
 * CSRF defense for cookie-authenticated endpoints (refresh, logout).
 * 1. SameSite=Strict cookie scoped to /api/v1/auth.
 * 2. A custom header, which forces a CORS preflight that foreign origins cannot pass.
 * 3. If the browser sends an Origin, it must be on the allowlist.
 */
export const requireCsrfHeader: RequestHandler = (req, _res, next) => {
  if (req.get('x-requested-with') !== 'EstateFlow') {
    return next(AppError.forbidden('Missing CSRF protection header.', 'CSRF_HEADER_REQUIRED'));
  }
  const origin = req.get('origin');
  if (origin && !allowedOrigins.includes(origin)) {
    return next(AppError.forbidden('Origin not allowed.', 'CSRF_ORIGIN_DENIED'));
  }
  next();
};