# EstateFlow CRM

A modern CRM for real estate professionals: leads, contacts, property listings, tasks,
follow-ups, and team performance in one place.

## Editions

| Edition | Description |
|---|---|
| **SaaS** | Hosted by us. Organizations register, subscribe, and get isolated data. |
| **Self-hosted** | Customer deploys with Docker Compose on their own infrastructure under a license. |

Both editions run the **same codebase**. Behavior differs only through the server-side
`DEPLOYMENT_MODE` setting (`SAAS` | `SELF_HOSTED`).

## Target customers

Independent agents, property dealers, agencies, property consultants, and small-to-medium
real estate teams.

## Technology stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query,
  React Hook Form, Zod, Recharts, Lucide Icons
- **Backend:** Node.js, Express, TypeScript, MongoDB, Mongoose, JWT + refresh tokens, Zod
- **Quality:** Git, ESLint, Prettier, Vitest, Supertest

## Architecture overview

A **modular monolith** in an npm-workspaces monorepo:

- `apps/api` - Express API, organized by business module
- `apps/web` - React SPA, organized by feature
- `packages/shared` - Zod schemas, enums, and types shared by both apps
- `packages/config` - shared TypeScript/ESLint configuration

CRM modules never reference billing or licensing directly. They call an
**entitlement interface** implemented by a subscription provider (SaaS) or a license
provider (self-hosted). See `docs/SYSTEM_ARCHITECTURE.md`.

## Prerequisites

Node.js 20+, npm 10+, Git. From Phase 2: MongoDB 7+ (or Docker), Docker Compose.

## Documentation

All design documents live in `docs/`:

1. PRODUCT_REQUIREMENTS.md
2. SYSTEM_ARCHITECTURE.md
3. DATABASE_SCHEMA.md
4. API_SPECIFICATION.md
5. MULTI_TENANCY.md
6. AUTHENTICATION_AND_SECURITY.md
7. SAAS_AND_SELF_HOSTED.md
8. BUSINESS_RULES.md
9. DEVELOPMENT_ROADMAP.md

## Development phases

See `docs/DEVELOPMENT_ROADMAP.md`. Phase 1 (planning and architecture) is complete when
these documents are reviewed and committed.

## Configuring the project (from Phase 2)

1. `cp apps/api/.env.example apps/api/.env`
2. Set `DEPLOYMENT_MODE`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `COOKIE_SECRET`, `CORS_ORIGINS`.
3. `npm install` at the repo root, then `npm run dev`.

Never commit `.env` files. Secrets are always supplied through environment variables.