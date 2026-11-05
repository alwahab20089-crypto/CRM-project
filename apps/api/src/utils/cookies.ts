import type { CookieOptions, Response } from 'express';
import { env, isProduction } from '../config/env';
import { REFRESH_TTL_MS } from './token';

export const REFRESH_COOKIE = 'ef_rt';

const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/api/v1/auth',
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
};

/** persistent=false produces a session cookie that disappears when the browser closes. */
export function setRefreshCookie(res: Response, token: string, persistent: boolean) {
  res.cookie(REFRESH_COOKIE, token, persistent ? { ...baseOptions, maxAge: REFRESH_TTL_MS } : baseOptions);
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, baseOptions);
}