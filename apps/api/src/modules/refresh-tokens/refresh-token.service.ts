import { randomUUID } from 'node:crypto';
import type { ClientSession, Types } from 'mongoose';
import { AppError } from '../../utils/app-error';
import type { RequestMeta } from '../../utils/request-meta';
import { generateOpaqueToken, hashToken, REFRESH_TTL_MS, signAccessToken } from '../../utils/token';
import { recordAudit } from '../audit/audit.service';
import { User } from '../users/user.model';
import { RefreshToken } from './refresh-token.model';

/** A second request carrying an already-rotated token within this window is a benign race (two tabs). */
const REUSE_GRACE_MS = 10_000;

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  refreshTokenId: Types.ObjectId;
  persistent: boolean;
}

export async function issueSession(
  user: { _id: Types.ObjectId; tokenVersion: number },
  meta: RequestMeta,
  options: { persistent: boolean; familyId?: string; session?: ClientSession },
): Promise<IssuedSession> {
  const refreshToken = generateOpaqueToken();
  const [record] = await RefreshToken.create(
    [
      {
        userId: user._id,
        familyId: options.familyId ?? randomUUID(),
        tokenHash: hashToken('refresh', refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        persistent: options.persistent,
        userAgent: meta.userAgent,
        ip: meta.ip,
      },
    ],
    { session: options.session },
  );
  return {
    accessToken: signAccessToken(String(user._id), user.tokenVersion),
    refreshToken,
    refreshTokenId: record!._id,
    persistent: options.persistent,
  };
}

const sessionExpired = () => AppError.unauthorized('Your session has expired. Please sign in again.', 'SESSION_EXPIRED');

/** Rotation: every refresh consumes the presented token and issues a new one in the same family. */
export async function rotateSession(rawToken: string | undefined, meta: RequestMeta) {
  if (!rawToken) throw sessionExpired();

  const existing = await RefreshToken.findOne({ tokenHash: hashToken('refresh', rawToken) });
  if (!existing) throw sessionExpired();

  const now = new Date();

  if (existing.revokedAt) {
    if (now.getTime() - existing.revokedAt.getTime() < REUSE_GRACE_MS) {
      throw AppError.unauthorized('A refresh is already in progress. Retry shortly.', 'REFRESH_CONFLICT');
    }
    // Reuse of a rotated or revoked token: assume theft and kill the whole family.
    await revokeFamily(existing.familyId);
    await recordAudit({
      actorId: existing.userId,
      action: 'auth.refresh_reuse_detected',
      resource: 'refresh_token',
      resourceId: existing._id,
      meta,
    });
    throw sessionExpired();
  }

  if (existing.expiresAt <= now) throw sessionExpired();

  const user = await User.findById(existing.userId);
  if (!user || user.status !== 'ACTIVE') {
    await revokeFamily(existing.familyId);
    throw sessionExpired();
  }

  // Atomic claim: only one concurrent request can consume this token.
  const claimed = await RefreshToken.findOneAndUpdate({ _id: existing._id, revokedAt: null }, { $set: { revokedAt: now } });
  if (!claimed) throw AppError.unauthorized('A refresh is already in progress. Retry shortly.', 'REFRESH_CONFLICT');

  const next = await issueSession(user, meta, { persistent: existing.persistent, familyId: existing.familyId });
  await RefreshToken.updateOne({ _id: existing._id }, { $set: { replacedByTokenId: next.refreshTokenId } });
  return { ...next, user };
}

export const revokeFamily = (familyId: string) =>
  RefreshToken.updateMany({ familyId, revokedAt: null }, { $set: { revokedAt: new Date() } });

export async function revokeFamilyByToken(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;
  const existing = await RefreshToken.findOne({ tokenHash: hashToken('refresh', rawToken) }).select('familyId');
  if (existing) await revokeFamily(existing.familyId);
}

export const revokeAllForUser = (userId: string | Types.ObjectId) =>
  RefreshToken.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });