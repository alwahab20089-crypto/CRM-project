import { getAuth } from '../../middleware/authenticate';
import { getTenant } from '../../middleware/require-membership';
import { sendSuccess } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { getRequestMeta } from '../../utils/request-meta';
import { toMembershipDto } from '../../utils/serializers';
import { listMembershipsForUser } from '../members/member.service';
import * as organizationService from './organization.service';

export const list = asyncHandler(async (req, res) => {
  const memberships = await listMembershipsForUser(getAuth(req).userId);
  sendSuccess(res, { data: memberships.map(toMembershipDto), meta: { total: memberships.length } });
});

export const create = asyncHandler(async (req, res) => {
  const result = await organizationService.createOrganization(getAuth(req).userId, req.body, getRequestMeta(req));
  sendSuccess(res, { status: 201, message: 'Organization created', data: toMembershipDto(result) });
});

export const get = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: toMembershipDto(await organizationService.getOrganizationContext(getTenant(req))) });
});

export const update = asyncHandler(async (req, res) => {
  const result = await organizationService.updateOrganization(
    getTenant(req),
    getAuth(req).userId,
    req.body,
    getRequestMeta(req),
  );
  sendSuccess(res, { message: 'Organization updated', data: toMembershipDto(result) });
});

/** Membership was just re-verified against the database by requireMembership. Returns the new context. */
export const switchTo = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    message: 'Organization switched',
    data: toMembershipDto(await organizationService.getOrganizationContext(getTenant(req))),
  });
});