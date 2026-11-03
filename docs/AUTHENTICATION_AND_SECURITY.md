# Authentication and Security

## Credentials
- Passwords: argon2id (or bcrypt cost ≥ 12), min length 10, breached-password check optional.
- Never log or return `passwordHash`; schema uses `select: false`.
- Login errors are generic ("Invalid credentials"); constant-time comparison; rate limited per IP and per account.

## Tokens
| Token | Format | Lifetime | Storage |
|---|---|---|---|
| Access | JWT (HS256 or RS256), claims `sub`, `tv` (tokenVersion), `iat`, `exp` | 15 min | Client memory only |
| Refresh | Opaque 256-bit random string | 7-30 days, rolling | httpOnly, Secure, SameSite=Strict cookie, `Path=/api/v1/auth` |

The server stores only the **SHA-256 hash** of each refresh token in `RefreshTokens`.

### Rotation and reuse detection
```mermaid
sequenceDiagram
  participant C as Client
  participant A as API
  participant DB as MongoDB
  C->>A: POST /auth/refresh (cookie: RT1)
  A->>DB: find hash(RT1)
  alt valid and unused
    A->>DB: mark RT1 replaced; insert RT2 (same familyId)
    A-->>C: new access token + Set-Cookie RT2
  else already used or revoked
    A->>DB: revoke entire family
    A-->>C: 401 (user must log in again)
  end
```
- **Logout:** revoke current family, clear cookie.
- **Logout all / password change / role removal:** bump `tokenVersion` and revoke all families.
- Access tokens are rejected if `tv` does not match the user's current value.
- Suspended users are rejected at `authenticate` (cached lookup, short TTL).

### CSRF
Refresh cookie is SameSite=Strict, scoped to `/auth`, and the endpoint requires a custom
header (`X-Requested-With`) plus an allowed `Origin`. All other endpoints use the Bearer header, so they are not CSRF-prone.

## Authorization
Two layers:
1. **Role defaults** (OWNER > ADMIN > MANAGER > AGENT), a static map `role -> permission[]`.
2. **Per-member overrides**: `permissions` (grants) and `deniedPermissions` (revokes).

Effective permissions = (role defaults ∪ grants) − denied. Permissions are strings like
`leads:read`, `leads:read_all`, `members:invite`, `analytics:read`, `billing:manage`.
Middleware: `authorize('leads:update')`. Ownership-style rules (e.g., agents only see assigned
leads) are enforced in services using the same tenant context.

| Permission area | OWNER | ADMIN | MANAGER | AGENT |
|---|---|---|---|---|
| Org settings, billing, license | Yes | Settings only | No | No |
| Members manage | Yes | Yes (not OWNER) | Read | No |
| Leads/Contacts/Properties all | Yes | Yes | Yes | Assigned/own |
| Analytics | Yes | Yes | Yes | Own stats only |
| Delete records | Yes | Yes | Limited | No |

## Audit logging
Audit (written by the `audit` service, not controllers):
login failures threshold, role/permission changes, member add/remove, ownership transfer, org
settings, license activation, billing state changes, data exports, bulk deletes, platform admin actions.
Entries include actor, org, action, resource, before/after (sanitized), IP, user agent, requestId.
Append-only, with no update/delete code paths.

## Platform hardening
- `helmet`, strict CORS allowlist from env, HTTPS only in production, `trust proxy` configured explicitly.
- Rate limiting (global + stricter on `/auth/*` and webhooks).
- Body size limits; `express.raw` only on webhook routes for signature verification.
- NoSQL injection: Zod-typed inputs, reject objects with `$` keys, `mongoSanitize`-style filtering.
- Uploads: type and size allowlist, random storage keys, no executable content served.
- Secrets only via env; startup fails if required secrets are missing or weak.
- Dependency auditing in CI (`npm audit`), Dependabot.
- Structured logs with request IDs; PII and secrets redacted.

## Required environment variables (documented now, implemented in Phase 2)
`NODE_ENV`, `DEPLOYMENT_MODE`, `PORT`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL`,
`REFRESH_TTL_DAYS`, `COOKIE_SECRET`, `CORS_ORIGINS`, `APP_URL`, `LOG_LEVEL`; SaaS: `BILLING_PROVIDER`,
`<PROVIDER>_WEBHOOK_SECRET`; self-hosted: `LICENSE_SERVER_URL`, `LICENSE_PUBLIC_KEY`.