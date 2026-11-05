import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { getTenant, requireMembership } from '../../middleware/require-membership';
import { resolveOrganization } from '../../middleware/resolve-organization';
import { sendSuccess } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { User } from '../users/user.model';
import { OrganizationMember } from './member.model';

export const memberRouter = Router();

memberRouter.use(authenticate, resolveOrganization('header'), requireMembership);

/** Active members of the verified organization only. */
memberRouter.get(
  '/',
  authorize('members:read'),
  asyncHandler(async (req, res) => {
    const { organizationId } = getTenant(req);
    const members = await OrganizationMember.find({ organizationId, status: 'ACTIVE', invitationStatus: 'ACCEPTED' })
      .sort({ joinedAt: 1 })
      .lean();
    const users = await User.find({ _id: { $in: members.map((m) => m.userId) }, status: 'ACTIVE' })
      .select('name email avatar')
      .lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    const data = members.flatMap((m) => {
      const user = byId.get(String(m.userId));
      return user ? [{ userId: String(user._id), name: user.name, email: user.email, avatar: user.avatar ?? undefined, role: m.role }] : [];
    });
    sendSuccess(res, { data, meta: { total: data.length } });
  }),
);