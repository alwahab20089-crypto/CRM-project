import type { Request, RequestHandler } from 'express';
import { findActiveMembership, toTenantContext } from '../modules/members/member.service';
import { Organization } from '../modules/organizations/organization.model';
import { AppError } from '../utils/app-error';
import { asyncHandler } from '../utils/async-handler';
import { getAuth } from './authenticate';

export const requireMembership: RequestHandler = asyncHandler(async (req, _res, next) => {
  const { userId } = getAuth(req);
  const organizationId = req.requestedOrganizationId;
  if (!organizationId) throw AppError.notFound('Organization not found');

  const membership = await findActiveMembership(userId, organizationId);
  if (!membership) throw AppError.notFound('Organization not found'); // 404, never 403

  const organization = await Organization.findById(organizationId).select('status');
  if (!organization || organization.status === 'DELETED') throw AppError.notFound('Organization not found');
  if (organization.status === 'SUSPENDED') {
    throw AppError.forbidden('This organization is suspended.', 'ORGANIZATION_SUSPENDED');
  }

  req.tenant = toTenantContext(membership);
  next();
});

export function getTenant(req: Request) {
  if (!req.tenant) throw new Error('requireMembership() must run before this handler');
  return req.tenant;
}