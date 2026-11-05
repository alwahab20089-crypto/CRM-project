import { randomBytes } from 'node:crypto';
import type { Types } from 'mongoose';
import { env } from '../../config/env';
import { AppError } from '../../utils/app-error';
import type { RequestMeta } from '../../utils/request-meta';
import { runUnitOfWork, type UnitOfWork } from '../../utils/transaction';
import { recordAudit } from '../audit/audit.service';
import { toTenantContext, type TenantContext } from '../members/member.service';
import { OrganizationMember } from '../members/member.model';
import { resolvePermissions } from '../members/permissions';
import { User } from '../users/user.model';
import { Organization } from './organization.model';
import type { CreateOrganizationInput, UpdateOrganizationInput } from './organization.validation';

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${base || 'org'}-${randomBytes(3).toString('hex')}`; // unique index is the final guard
}

/** Shared by registration and organization creation. Must run inside a unit of work. */
export async function createOrganizationWithOwner(
  uow: UnitOfWork,
  ownerId: Types.ObjectId,
  data: CreateOrganizationInput,
  meta: RequestMeta,
) {
  const [organization] = await Organization.create(
    [{ ...data, slug: slugify(data.name), ownerId }],
    { session: uow.session },
  );
  uow.onRollback(() => Organization.deleteOne({ _id: organization!._id }));

  const [membership] = await OrganizationMember.create(
    [
      {
        organizationId: organization!._id,
        userId: ownerId,
        role: 'OWNER',
        invitationStatus: 'ACCEPTED',
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
    ],
    { session: uow.session },
  );
  uow.onRollback(() => OrganizationMember.deleteOne({ _id: membership!._id }));

  await recordAudit(
    {
      organizationId: organization!._id,
      actorId: ownerId,
      action: 'organization.created',
      resource: 'organization',
      resourceId: organization!._id,
      after: { name: data.name },
      meta,
    },
    uow.session,
  );

  return { organization: organization!, membership: membership! };
}

export async function createOrganization(userId: string, input: CreateOrganizationInput, meta: RequestMeta) {
  if (env.DEPLOYMENT_MODE === 'SELF_HOSTED') {
    throw AppError.forbidden('This installation supports a single organization.', 'SINGLE_ORGANIZATION_MODE');
  }
  const user = await User.findById(userId).select('email');
  if (!user) throw AppError.unauthorized();

  const { organization } = await runUnitOfWork((uow) =>
    createOrganizationWithOwner(uow, user._id, { ...input, email: input.email ?? user.email }, meta),
  );
  return { organization, role: 'OWNER' as const, permissions: resolvePermissions('OWNER') };
}

/** Context for an already-verified tenant (membership was checked by middleware). */
export async function getOrganizationContext(tenant: TenantContext) {
  const organization = await Organization.findOne({ _id: tenant.organizationId, status: 'ACTIVE' });
  if (!organization) throw AppError.notFound('Organization not found');
  return { organization, role: tenant.role, permissions: tenant.permissions };
}

export async function updateOrganization(
  tenant: TenantContext,
  actorId: string,
  input: UpdateOrganizationInput,
  meta: RequestMeta,
) {
  const { address, ...rest } = input;
  const update: Record<string, unknown> = { ...rest };
  if (address) for (const [key, value] of Object.entries(address)) update[`address.${key}`] = value;

  // Filter is always the verified tenant id, never a client-supplied one.
  const organization = await Organization.findOne({ _id: tenant.organizationId, status: 'ACTIVE' });
  if (!organization) throw AppError.notFound('Organization not found');

  const before = Object.fromEntries(Object.keys(update).map((k) => [k, organization.get(k)]));
  organization.set(update);
  await organization.save();

  await recordAudit({
    organizationId: organization._id,
    actorId,
    action: 'organization.updated',
    resource: 'organization',
    resourceId: organization._id,
    before,
    after: update,
    meta,
  });

  return { organization, role: tenant.role, permissions: tenant.permissions };
}

export { toTenantContext };