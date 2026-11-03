# Multi-Tenancy

## Strategy
Shared database, shared collections, discriminated by `organizationId`. It's the cheapest to operate
and works for both editions. Self-hosted mode simply has one organization.

## Tenant resolution
1. `authenticate` verifies the JWT and loads `req.auth = { userId, tokenVersion }`.
2. `resolveOrganization` reads the org selector from `X-Organization-Id`
   (self-hosted: the single organization if the header is absent).
3. `requireMembership` queries `OrganizationMembers {organizationId, userId, status:ACTIVE, invitationStatus:ACCEPTED}`.
   No membership returns **404** (do not disclose that the org exists).
4. Result is attached as `req.tenant = { organizationId, role, permissions }`. This is the **only**
   source of `organizationId` for downstream code.

```mermaid
flowchart LR
  R[Request] --> RID[requestId] --> SEC[helmet/cors/rate-limit] --> BP[body parser + limits]
  BP --> AU[authenticate] --> RO[resolveOrganization] --> MB[requireMembership]
  MB --> EN[entitlement guard] --> AZ[authorize permission] --> V[validate Zod] --> C[controller] --> S[service]
  S --> E[errorHandler]
```
Order rationale: cheap rejections first; authorization before validation so unauthorized
users learn nothing about schemas; entitlements after membership because they are per-tenant.

## Enforcement rules
1. Services take `tenant` as an explicit argument. They never read `organizationId` from request bodies.
2. All org-owned data access goes through **tenant-scoped repositories**:
   ```ts
   const leads = scopedModel(Lead, tenant.organizationId);
   leads.findById(id);   // internally: { _id: id, organizationId }
   ```
   Direct `Model.find()` on org-owned models is blocked by an ESLint rule and code review.
3. `findById`/`update`/`delete` always include `organizationId` in the filter (prevents IDOR).
4. Any referenced IDs in a payload (`assignedTo`, `ownerContactId`, `relatedLeadId`) are re-verified
   to be in the same organization before saving.
5. Body schemas use `.strict()` or strip unknown keys, which prevents mass assignment of
   `organizationId`, `role`, `createdBy`.
6. Aggregations must begin with `$match: { organizationId }`.
7. Background jobs receive `organizationId` explicitly and use the same scoped repositories.
8. File storage keys are prefixed `org/<organizationId>/...`; downloads are authorized, not public listings.
9. Cache keys include `organizationId`.

## Platform vs organization privileges
`Users.platformRole = PLATFORM_ADMIN` grants access only to `/admin/*`. It does **not** grant
membership in any organization. Platform admin routes use a separate `requirePlatformAdmin`
guard, and every use is audit-logged. OWNER/ADMIN roles never grant platform access.

## Testing requirements
- For every org-scoped route: a test that user A (org 1) receives 404 for org 2's resource ID.
- Tests for mass assignment (`organizationId` in body ignored).
- Tests for cross-org reference injection (`assignedTo` of another org returns 422).
- A repository-level test proving scoped queries cannot omit `organizationId`.