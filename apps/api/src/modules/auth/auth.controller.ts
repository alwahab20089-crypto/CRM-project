import { getAuth } from '../../middleware/authenticate';
import { AppError } from '../../utils/app-error';
import { sendSuccess } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from '../../utils/cookies';
import { getRequestMeta } from '../../utils/request-meta';
import { toMembershipDto, toOrganizationDto, toUserDto } from '../../utils/serializers';
import { ACCESS_TTL_SECONDS } from '../../utils/token';
import { revokeFamilyByToken, rotateSession } from '../refresh-tokens/refresh-token.service';
import * as authService from './auth.service';

export const register = asyncHandler(async (req, res) => {
  const { user, organization, role, permissions, tokens } = await authService.register(req.body, getRequestMeta(req));
  setRefreshCookie(res, tokens.refreshToken, tokens.persistent);
  sendSuccess(res, {
    status: 201,
    message: 'Account created successfully',
    data: {
      accessToken: tokens.accessToken,
      expiresIn: ACCESS_TTL_SECONDS,
      user: toUserDto(user),
      organization: toOrganizationDto(organization),
      membership: { role, permissions },
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.login(req.body, getRequestMeta(req));
  setRefreshCookie(res, tokens.refreshToken, tokens.persistent);
  sendSuccess(res, {
    message: 'Signed in successfully',
    data: { accessToken: tokens.accessToken, expiresIn: ACCESS_TTL_SECONDS, user: toUserDto(user) },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    const session = await rotateSession(req.cookies?.[REFRESH_COOKIE], getRequestMeta(req));
    setRefreshCookie(res, session.refreshToken, session.persistent);
    sendSuccess(res, { message: 'Session refreshed', data: { accessToken: session.accessToken, expiresIn: ACCESS_TTL_SECONDS } });
  } catch (err) {
    if (err instanceof AppError && err.code !== 'REFRESH_CONFLICT') clearRefreshCookie(res);
    throw err;
  }
});

export const logout = asyncHandler(async (req, res) => {
  await revokeFamilyByToken(req.cookies?.[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  sendSuccess(res, { message: 'Signed out' });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(getAuth(req).userId, getRequestMeta(req));
  clearRefreshCookie(res);
  sendSuccess(res, { message: 'Signed out of all devices' });
});

export const me = asyncHandler(async (req, res) => {
  const header = req.get('x-organization-id');
  const { user, organizations, current } = await authService.getAuthContext(getAuth(req).userId, header ?? undefined);
  sendSuccess(res, {
    data: {
      user: toUserDto(user),
      organizations: organizations.map(toMembershipDto),
      current: current ? toMembershipDto(current) : null,
    },
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.body.email, getRequestMeta(req));
  sendSuccess(res, { message: 'If an account exists for that email, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password, getRequestMeta(req));
  sendSuccess(res, { message: 'Password updated. You can now sign in.' });
});