import type { Types } from 'mongoose';
import type { MemberRole } from '../../constants';
import { generateOpaqueToken, hashToken } from '../../utils/token';
import { Invitation } from './invitation.model';

const INVITATION_TTL_MS = 7 * 24 * 3600 * 1000;

/** Foundation only: no HTTP routes yet (team management ships later). Raw token is returned once, never stored. */
export async function createInvitation(input: {
  organizationId: string | Types.ObjectId;
  email: string;
  role: Exclude<MemberRole, 'OWNER'>;
  invitedBy: string | Types.ObjectId;
}) {
  const token = generateOpaqueToken();
  const invitation = await Invitation.create({
    ...input,
    email: input.email.toLowerCase(),
    tokenHash: hashToken('invitation', token),
    expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
  });
  return { invitation, token };
}

export const findPendingInvitationByToken = (token: string) =>
  Invitation.findOne({ tokenHash: hashToken('invitation', token), status: 'PENDING', expiresAt: { $gt: new Date() } });