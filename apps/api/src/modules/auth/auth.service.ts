import * as argon2 from 'argon2';
import { env } from '../../config/env';
import { AppError } from '../../utils/app-error';
import { mailer } from '../../utils/mailer';
import type { RequestMeta } from '../../utils/request-meta';
import { runUnitOfWork } from '../../utils/transaction';
import { generateOpaqueToken, hashToken } from '../../utils/token';
import { recordAudit } from '../audit/audit.service';
import { findActiveMembership, listMembershipsForUser, toTenantContext } from '../members/member.service';
import { createOrganizationWithOwner } from '../organizations/organization.service';
import { issueSession, revokeAllForUser } from '../refresh-tokens/refresh-token.service';
import { User } from '../users/user.model';
import { PasswordResetToken } from './password-reset-token.model';
import type { LoginInput, RegisterInput } from './auth.validation';

// OWASP-recommended Argon2id parameters (19 MiB, 2 iterations, 1 lane).
const ARGON_OPTIONS = { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;
export const hashPassword = (password: string) => argon2.hash(password, ARGON_OPTIONS);

// Verified when the account does not exist, so response time does not reveal which emails are registered.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword('estateflow-timing-equalizer'));

const RESET_TTL_MS = 60 * 60 * 1000;

export async function register(input: RegisterInput, meta: RequestMeta) {
  if (env.DEPLOYMENT_MODE === 'SELF_HOSTED' && (await User.exists({}))) {
    throw AppError.forbidden('Registration is closed. Ask an administrator for an invitation.', 'REGISTRATION_CLOSED');
  }
  if (await User.exists({ email: input.email })) {
    throw AppError.conflict('An account with this email already exists.', 'EMAIL_IN_USE');
  }

  const passwordHash = await hashPassword(input.password);

  const { user, organization, membership } = await runUnitOfWork(async (uow) => {
    const [createdUser] = await User.create([{ name: input.name, email: input.email, passwordHash }], {
      session: uow.session,
    });
    uow.onRollback(() => User.deleteOne({ _id: createdUser!._id }));

    const created = await createOrganizationWithOwner(
      uow,
      createdUser!._id,
      { name: input.organizationName, email: input.email },
      meta,
    );
    await recordAudit(
      { actorId: createdUser!._id, action: 'auth.registered', resource: 'user', resourceId: createdUser!._id, meta },
      uow.session,
    );
    return { user: createdUser!, ...created };
  });

  const tokens = await issueSession(user, meta, { persistent: true });
  return { user, organization, ...toTenantContext(membership), tokens };
}

export async function login(input: LoginInput, meta: RequestMeta) {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  const hash = user?.passwordHash ?? (await getDummyHash());
  const passwordOk = await argon2.verify(hash, input.password).catch(() => false);

  if (!user || !passwordOk || user.status === 'DELETED') {
    if (user) {
      await recordAudit({ actorId: user._id, action: 'auth.login_failed', resource: 'user', resourceId: user._id, meta });
    }
    // Same message for unknown email and wrong password.
    throw AppError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
  }
  if (user.status !== 'ACTIVE') {
    throw AppError.forbidden('This account is suspended. Please contact support.', 'ACCOUNT_SUSPENDED');
  }

  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  const tokens = await issueSession(user, meta, { persistent: input.remember });
  return { user, tokens };
}

export async function getAuthContext(userId: string, preferredOrganizationId?: string) {
  const user = await User.findById(userId);
  if (!user) throw AppError.unauthorized();

  const organizations = await listMembershipsForUser(userId);
  // The preferred id is only honored if it is one of the user's own memberships.
  const current =
    organizations.find((m) => String(m.organization._id) === preferredOrganizationId) ?? organizations[0] ?? null;
  return { user, organizations, current };
}

export async function logoutAll(userId: string, meta: RequestMeta) {
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } }); // invalidates every access token
  await revokeAllForUser(userId);
  await recordAudit({ actorId: userId, action: 'auth.logout_all', resource: 'user', resourceId: userId, meta });
}

/** Always completes silently so callers cannot learn whether the email exists. */
export async function requestPasswordReset(email: string, meta: RequestMeta): Promise<void> {
  const user = await User.findOne({ email, status: 'ACTIVE' });
  if (!user) return;

  await PasswordResetToken.updateMany({ userId: user._id, usedAt: null }, { $set: { usedAt: new Date() } });
  const token = generateOpaqueToken();
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: hashToken('password-reset', token),
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
  });
  await recordAudit({ actorId: user._id, action: 'auth.password_reset_requested', resource: 'user', resourceId: user._id, meta });
  await mailer.sendPasswordReset({ to: user.email, token });
}

export async function resetPassword(token: string, newPassword: string, meta: RequestMeta): Promise<void> {
  const now = new Date();
  // Atomic single-use: only one request can flip usedAt from null.
  const record = await PasswordResetToken.findOneAndUpdate(
    { tokenHash: hashToken('password-reset', token), usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
  );
  if (!record) throw AppError.badRequest('This reset link is invalid or has expired.', 'INVALID_RESET_TOKEN');

  const passwordHash = await hashPassword(newPassword);
  await User.updateOne({ _id: record.userId }, { $set: { passwordHash }, $inc: { tokenVersion: 1 } });
  await revokeAllForUser(record.userId); // every existing session must sign in again
  await recordAudit({ actorId: record.userId, action: 'auth.password_reset_completed', resource: 'user', resourceId: record.userId, meta });
}

export { findActiveMembership };