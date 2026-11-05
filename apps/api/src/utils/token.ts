import { createHmac, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

const { sign, verify, TokenExpiredError } = jwt;
import { env } from '../config/env';
import { AppError } from './app-error';
import { isObjectId } from './object-id';

export function parseDurationSeconds(value: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);
  if (!match) throw new Error('Invalid duration');
  const unit = { s: 1, m: 60, h: 3600, d: 86_400 }[match[2] as 's' | 'm' | 'h' | 'd'];
  return Number(match[1]) * unit;
}

export const ACCESS_TTL_SECONDS = parseDurationSeconds(env.JWT_ACCESS_EXPIRES_IN);
export const REFRESH_TTL_MS = parseDurationSeconds(env.JWT_REFRESH_EXPIRES_IN) * 1000;

const ISSUER = 'estateflow-api';
const AUDIENCE = 'estateflow-web';

/** Minimal claims: subject and token version. Organization membership is never trusted from a token. */
export function signAccessToken(userId: string, tokenVersion: number): string {
  return sign({ tv: tokenVersion }, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    subject: userId,
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: ACCESS_TTL_SECONDS,
  });
}

export function verifyAccessToken(token: string): { sub: string; tv: number } {
  try {
    const payload = verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload === 'string' || !isObjectId(payload.sub) || typeof payload.tv !== 'number') {
      throw new Error('bad claims');
    }
    return { sub: payload.sub, tv: payload.tv };
  } catch (err) {
    if (err instanceof TokenExpiredError) throw AppError.unauthorized('Access token expired', 'TOKEN_EXPIRED');
    throw AppError.unauthorized('Invalid access token', 'INVALID_TOKEN');
  }
}

export type TokenPurpose = 'refresh' | 'password-reset' | 'invitation';

/** 256-bit random opaque token (sent to the client once, never stored). */
export const generateOpaqueToken = () => randomBytes(32).toString('base64url');

/** Keyed hash with per-purpose domain separation. Only this hash is stored in the database. */
export const hashToken = (purpose: TokenPurpose, token: string) =>
  createHmac('sha256', env.JWT_REFRESH_SECRET).update(`${purpose}:${token}`).digest('hex');