import type { RequestHandler } from 'express';
import { findFirstOrganizationId } from '../modules/members/member.service';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';
import { asyncHandler } from '../utils/async-handler';
import { isObjectId } from '../utils/object-id';
import { getAuth } from './authenticate';

/**
 * Determines WHICH organization the client is asking about. The result is only a candidate:
 * requireMembership must verify it against the database before anything trusts it.
 */
export const resolveOrganization = (source: 'param' | 'header'): RequestHandler =>
  asyncHandler(async (req, _res, next) => {
    let candidate: unknown = source === 'param' ? req.params.organizationId : req.get('x-organization-id');

    if (candidate === undefined && source === 'header') {
      if (env.DEPLOYMENT_MODE !== 'SELF_HOSTED') {
        throw AppError.badRequest('The X-Organization-Id header is required.', 'ORGANIZATION_REQUIRED');
      }
      candidate = (await findFirstOrganizationId(getAuth(req).userId)) ?? undefined; // single-org installs
    }

    // Malformed and unknown ids look identical to "not a member": 404, no existence disclosure.
    if (!isObjectId(candidate)) throw AppError.notFound('Organization not found');
    req.requestedOrganizationId = candidate;
    next();
  });