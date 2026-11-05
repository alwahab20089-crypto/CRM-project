import type { RequestHandler } from 'express';
import { AppError } from '../utils/app-error';

/** All listed permissions are required. Must run after requireMembership. */
export const authorize =
  (...required: string[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.tenant) return next(new Error('authorize() must run after requireMembership()'));
    const missing = required.filter((p) => !req.tenant!.permissions.includes(p));
    if (missing.length > 0) return next(AppError.forbidden());
    next();
  };

/** Platform administration is a separate privilege. It grants NO access to any organization's data. */
export const requirePlatformAdmin: RequestHandler = (req, _res, next) =>
  req.auth?.platformRole === 'PLATFORM_ADMIN' ? next() : next(AppError.forbidden());