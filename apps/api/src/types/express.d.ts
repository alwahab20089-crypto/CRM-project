import type { MemberRole } from '../constants';

declare module 'express-serve-static-core' {
  interface Request {
    id: string;
    auth?: { userId: string; platformRole: string };
    /** Organization id requested by the client. Untrusted until requireMembership verifies it. */
    requestedOrganizationId?: string;
    /** Verified tenant context. The ONLY source of organizationId for downstream code. */
    tenant?: { organizationId: string; memberId: string; role: MemberRole; permissions: string[] };
  }
}