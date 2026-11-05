
import type { Request, RequestHandler } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';

export interface RateLimitOptions {
  authRateLimitMax?: number;
  loginFailureLimitMax?: number;
}

export interface RateLimiters {
  global: RequestHandler;
  auth: RequestHandler;
  loginAccount: RequestHandler;
  write: RequestHandler;
}

const WINDOW_MS = 15 * 60 * 1000;

const accountKey = (req: Request) =>
  String(
    (req.body as { email?: unknown } | undefined)?.email ?? '',
  ).toLowerCase().slice(0, 254);

// In-memory store: fine for one process. Use a shared store (e.g. Redis) when running several API instances.
export function createRateLimiters(
  options: RateLimitOptions = {},
): RateLimiters {
  const base = {
    windowMs: WINDOW_MS,
    standardHeaders: 'draft-7' as const,
    legacyHeaders: false,
    handler: (
      _req: Request,
      _res: unknown,
      next: (err: unknown) => void,
    ) => next(AppError.tooManyRequests()),
  };

  return {
    global: rateLimit({ ...base, limit: 600 }),

    auth: rateLimit({
      ...base,
      limit: options.authRateLimitMax ?? env.AUTH_RATE_LIMIT_MAX,
    }),

    // Per account + IP, counting only failed attempts (brute-force protection).
    loginAccount: rateLimit({
      ...base,
      limit: options.loginFailureLimitMax ?? env.LOGIN_FAILURE_LIMIT_MAX,
      skipSuccessfulRequests: true,
      keyGenerator: (req) =>
        `${ipKeyGenerator(req.ip ?? '')}|${accountKey(req)}`,
    }),

    // Mutations: counted per authenticated user (falls back to IP).
    write: rateLimit({
      ...base,
      limit: 300,
      keyGenerator: (req) =>
        req.auth?.userId ?? ipKeyGenerator(req.ip ?? ''),
    }),
  };
}
