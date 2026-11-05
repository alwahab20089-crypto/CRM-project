import { Organization } from '../organizations/organization.model';
import type { MemberRole } from '../../constants';
import { OrganizationMember, type MemberDoc } from './member.model';
import { resolvePermissions } from './permissions';

export type TenantContext = {
  organizationId: string;
  memberId: string;
  role: MemberRole;
  permissions: string[];
};

export const findActiveMembership = (userId: string, organizationId: string) =>
  OrganizationMember.findOne({ userId, organizationId, status: 'ACTIVE', invitationStatus: 'ACCEPTED' });

export async function findFirstOrganizationId(userId: string): Promise<string | null> {
  const member = await OrganizationMember.findOne({ userId, status: 'ACTIVE', invitationStatus: 'ACCEPTED' })
    .sort({ joinedAt: 1 })
    .select('organizationId');
  return member ? String(member.organizationId) : null;
}

export function toTenantContext(member: MemberDoc): TenantContext {
  const role = member.role as MemberRole;
  return {
    organizationId: String(member.organizationId),
    memberId: String(member._id),
    role,
    permissions: resolvePermissions(role, member.permissions, member.deniedPermissions),
  };
}

/** Every active organization the user belongs to, with their role and effective permissions. */
export async function listMembershipsForUser(userId: string) {
  const members = await OrganizationMember.find({ userId, status: 'ACTIVE', invitationStatus: 'ACCEPTED' }).sort({
    joinedAt: 1,
  });
  const organizations = await Organization.find({
    _id: { $in: members.map((m) => m.organizationId) },
    status: 'ACTIVE',
  });
  const byId = new Map(organizations.map((o) => [String(o._id), o]));

  return members.flatMap((m) => {
    const organization = byId.get(String(m.organizationId));
    if (!organization) return [];
    const { role, permissions } = toTenantContext(m);
    return [{ organization, role, permissions }];
  });
}