# Development Roadmap

| Phase | Goal | Key deliverables | New dependencies |
|---|---|---|---|
| 1 | Planning and architecture | Docs, structure, README | None (Prettier optional) |
| 2 | Foundation | npm workspaces, TS configs, ESLint/Prettier, Vitest; API bootstrap, env validation, Mongo connection, error handler, health route, shared package | typescript, tsx, express, mongoose, zod, helmet, cors, cookie-parser, pino, dotenv, vitest, supertest, eslint, prettier |
| 3 | Auth and tenancy | Users, orgs, members, invitations, JWT + refresh rotation, middleware chain, audit service, tenant-scoped repository, isolation tests | jsonwebtoken, argon2 (or bcrypt), express-rate-limit |
| 4 | Leads and contacts | CRUD, filters, search, assignment, status flow, conversion, activities | None |
| 5 | Properties, tasks, notifications | CRUD, images/upload, reminders, notification generation | multer (or storage SDK) |
| 6 | Frontend app | Vite + React shell, auth flow, layouts, leads/contacts UI | react, react-router, @tanstack/react-query, react-hook-form, @hookform/resolvers, tailwindcss, shadcn/ui, lucide-react |
| 7 | Properties/tasks UI and analytics | Pages, dashboards | recharts |
| 8 | SaaS commercial layer | Plans, subscriptions, entitlements, webhook adapters, trial/grace, admin console | provider SDKs only if needed |
| 9 | Self-hosted layer | License module, setup wizard, Docker Compose, install docs | None (Docker tooling) |
| 10 | Hardening and release | Security review, load testing, backups, CI/CD, user docs, sales pages | k6 or similar (dev) |

## Phase gates
Each phase ends with passing tests, updated docs, and zero known cross-tenant leakage bugs.

## Risks
- Gumroad/Lemon Squeezy capabilities for subscriptions and license keys differ; verify before Phase 8.
- Offline license enforcement is bypassable; set expectations commercially.
- MongoDB transactions (replica set) are needed for some multi-document operations; the Docker
  Compose Mongo should run as a single-node replica set.
- Property pricing: decide integer minor units vs Decimal128 before Phase 5.