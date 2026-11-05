import type { Request, RequestHandler } from 'express';
import { User } from '../modules/users/user.model';
import { AppError } from '../utils/app-error';
import { asyncHandler } from '../utils/async-handler';
import { verifyAccessToken } from '../utils/token';

export const authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) throw AppError.unauthorized();

  const claims = verifyAccessToken(token);
  const user = await User.findById(claims.sub).select('status platformRole tokenVersion');
  if (!user || user.status !== 'ACTIVE' || user.tokenVersion !== claims.tv) {
    throw AppError.unauthorized('Invalid access token', 'INVALID_TOKEN');
  }

  req.auth = { userId: String(user._id), platformRole: user.platformRole };
  next();
});

export function getAuth(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth;
}