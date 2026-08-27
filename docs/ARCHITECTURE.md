# Architecture

Used vehicle marketplace for Chhattisgarh — cars, bikes, scooters, tractors, auto-rickshaws,
pickups, trucks, and other commercial vehicles. Customers reach sellers only through the
platform's local agents, never directly.

This document is the reference for how the system is put together. It reflects what is actually
built, not a wishlist — update it as real architectural decisions are made.

## Brand configuration

The brand name is not finalized. Every app reads it from `packages/shared-config/src/brand.ts` —
never hardcode it in a component, page title, or template. Renaming the platform later means
changing one file.

## System overview

```
Customer Web (Next.js, :3000)     Admin/Agent Web (Next.js, :3001)
              \                          /
               \        REST + WebSocket
                v                        v
                    NestJS API (:4000)
                    modular monolith, one deployable
                 /          |            |          \
                v           v            v           v
          PostgreSQL      Redis    S3-compatible   External adapters
          (Prisma)     (cache/    storage (media)  (SMS/OTP, FCM,
                        sockets)                     FFmpeg for reels)
```

**Monorepo**: pnpm workspaces + Turborepo. One repo for customer web, admin web, and the API today;
a React Native app is added later as `apps/mobile` without touching the backend.

## Folder structure

```
cg-vehicle-marketplace/
├── apps/
│   ├── web/            Customer-facing Next.js app (App Router, TS, Tailwind)
│   ├── admin/           Admin + agent Next.js app
│   └── api/             NestJS backend
│       └── src/
│           ├── modules/       one folder per business domain (health, vehicles, enquiries, ...)
│           ├── infra/         shared infrastructure (database, future storage/SMS adapters)
│           └── config/        environment validation
├── packages/
│   └── shared-config/   brand.ts — single source of truth for brand identity
├── docker-compose.yml   local Postgres, Redis, MinIO
└── docs/ARCHITECTURE.md this file
```

`packages/ui` and `packages/shared-types` are deliberately not created yet — they get added once
there is an actual cross-app component or DTO to share. Creating them empty ahead of need would be
premature abstraction.

## Core database entities

| Entity                       | Purpose                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| `users`                      | Customers, agents, admins — one account model, role-differentiated       |
| `agents` / `dealers`         | Role-specific profile data linked to a user                              |
| `locations`                  | Chhattisgarh districts, used for listing scope and fallback              |
| `categories`                 | Car / bike / tractor / etc.                                              |
| `vehicles`                   | The listing itself — internal UUID `id`, separate sequential `public_id` |
| `vehicle_media`              | Photos per vehicle, approval-gated                                       |
| `vehicle_verifications`      | Admin sign-off record for a listing                                      |
| `enquiries`                  | A customer's interest in a vehicle, owned by an assigned agent           |
| `conversations` / `messages` | Chat transcript tied to an enquiry or vehicle                            |
| `call_logs`                  | Call outcomes tied to an enquiry                                         |
| `favorites`                  | User ↔ vehicle saved listings                                            |
| `notifications`              | Per-user notification feed                                               |
| `reviews`                    | Ratings tied to a vehicle or agent                                       |
| `reels`                      | Generated Instagram Reel metadata (Phase 6)                              |
| `audit_logs`                 | Sensitive admin/agent actions, for accountability                        |

**Public Vehicle ID**: a Postgres sequence assigns `public_id` at _approval_ time, not at draft
creation, so abandoned or rejected drafts never burn a visible ID. The internal `id` is never
exposed in a customer-facing URL or API response.

## Authentication

- **Customers**: phone + OTP. SMS delivery sits behind a provider-agnostic adapter interface so
  the actual vendor is swappable without touching business logic.
- **Admin/Agents**: email + password (accounts created by an admin, no public signup).
- **Tokens**: short-lived JWT access token + rotating, hashed refresh token.
- **Authorization**: NestJS Guards + a role decorator (`Customer` / `Agent` / `Admin`). Plain
  enum-based RBAC — no policy engine until a real need for per-resource conditions appears.

## Role / permission matrix

| Capability                         | Customer |       Agent        |  Admin   |
| ---------------------------------- | :------: | :----------------: | :------: |
| Browse/search vehicles             |    ✅    |         ✅         |    ✅    |
| Submit vehicle for sale            |    ✅    |         —          |    ✅    |
| Approve/reject vehicle             |    —     |         —          |    ✅    |
| View own enquiries                 |    ✅    |         —          |    ✅    |
| View assigned enquiries            |    —     |      ✅ (own)      | ✅ (all) |
| Update enquiry status/notes        |    —     |      ✅ (own)      |    ✅    |
| View customer contact info         |    —     | ✅ (assigned only) |    ✅    |
| Manage categories/locations/agents |    —     |         —          |    ✅    |
| Generate/publish reels             |    —     |     draft only     |    ✅    |
| Platform settings                  |    —     |         —          |    ✅    |

Enforced server-side only — the frontend never assumes a permission the API doesn't also check.

## Key technical decisions

| Decision          | Choice                                                                | Why                                                                                                                |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| ORM               | Prisma 7 (driver-adapter mode, `@prisma/adapter-pg`)                  | Type-safe queries, first-class migrations; v7 dropped the bundled engine binary in favor of native driver adapters |
| Monorepo tool     | pnpm + Turborepo                                                      | Lightweight, cached task graph, low operational overhead                                                           |
| Public Vehicle ID | DB sequence, assigned on approval                                     | Simple, collision-free, decoupled from the internal PK                                                             |
| State machines    | Plain TS transition-table service per entity (vehicle/enquiry status) | Enforces valid transitions centrally without an external library to learn                                          |
| Search            | Postgres full-text + indexed filters                                  | Sufficient at this scale; defer OpenSearch until proven insufficient                                               |
| Realtime          | Socket.IO; Redis adapter added only when scaling beyond one instance  | Standard, well-supported, no premature complexity                                                                  |
| File storage      | S3-compatible, adapter-isolated                                       | AWS S3 in production, MinIO locally, swappable                                                                     |
| Env validation    | Joi schema via `@nestjs/config`                                       | Fails fast on boot instead of surfacing a confusing error at first use                                             |
| Health checks     | `@nestjs/terminus` + its built-in Prisma indicator                    | Standard NestJS pattern, no custom code needed                                                                     |

### Note on Prisma 7

Prisma 7 is a recent major version with real breaking changes from what most guides describe:

- No bundled query engine — connections go through a driver adapter (`@prisma/adapter-pg` + `pg`
  for Postgres).
- The client generates to a custom output folder (`apps/api/src/generated/prisma`, gitignored,
  regenerated via `prisma generate` — wired into `postinstall` and `prebuild`), not into
  `node_modules/@prisma/client`. It lives under `src/` specifically — see the rootDir note below.
- The CLI no longer auto-loads `.env`; `prisma7.config.ts` imports `dotenv/config` explicitly.
- `prisma init`'s "install agent skills" step (which drops reference docs into `.claude/`,
  `.windsurf/`, `.agents/`) was removed after generation — it's unrelated to the app and not
  something this project opted into.

npm's `latest` tag for `prisma`/`@prisma/client` currently points at an `8.0.0-rc.*` release
candidate. Both packages are pinned to the last stable line, `7.10.0`, matched exactly — never
install an RC for this project without a deliberate decision to do so.

The generated client's own source uses `.js`-suffixed relative imports (valid under our
`nodenext` TypeScript config, resolved to the sibling `.ts` file at compile time). Two tools
don't replicate that resolution at runtime:

- **Jest** — fixed with a `moduleNameMapper` entry in `apps/api/package.json` that strips the
  trailing `.js` so its resolver finds the `.ts` file.
- **`ts-node` running a standalone script** (e.g. the seed script) — `ts-node` only intercepts
  requires for files literally ending in `.ts`, so a `.js`-suffixed require aimed at a `.ts` file
  fails with `MODULE_NOT_FOUND` before ts-node ever sees it. Rather than patching Node's module
  resolution, `db:seed` compiles via its own `tsconfig.seed.json` and runs the output
  (`node dist-seed/prisma/seed.js`) — the same pattern `start:prod` uses for the main app.

The generated client also has to live under `src/`, not as a sibling `apps/api/generated/` —
any file outside `src/` that ends up in the compiled dependency graph (the seed script,
`prisma7.config.ts`, or a sibling `generated/`) widens tsc's inferred `rootDir` to the repo-level
common ancestor, which silently moves `dist/main.js` to `dist/src/main.js` and breaks
`start:prod`. `tsconfig.build.json` explicitly excludes `prisma/` and `prisma7.config.ts` for
the same reason.

## Development phases

| Phase                        | Goal                                                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Foundation               | Repo scaffold, both Next.js apps, NestJS boot, Prisma+Postgres, health check, lint/format/CI _(done)_                                         |
| 1 — Core Marketplace         | Categories, locations + district fallback, vehicle CRUD + status workflow, public ID, browse/search/filter/sort, vehicle detail page _(done)_ |
| 2 — Sell + Verification      | Sell flow, media upload, admin review/approve/reject queue _(done)_                                                                           |
| 3 — Enquiry & Agent Workflow | Enquiry creation, agent assignment, status state machine, basic chat, call logging                                                            |
| 4 — Accounts & Engagement    | OTP auth polish, favorites, notifications, reviews                                                                                            |
| 5 — Intelligent Chat Layer   | AI orchestration on top of Phase 3's deterministic data — never a source of truth                                                             |
| 6 — Reel Studio              | Template-based FFmpeg video generation, only after 1–4 are stable                                                                             |
| 7 — Mobile App               | React Native consuming the same API                                                                                                           |

### Phase 2 notes

- **Staff auth** landed here rather than waiting for Phase 4, since the admin review queue
  genuinely needs it — exposing approve/reject without auth would be a real hole. It's
  deliberately narrow: email + password for admin/agent only, JWT access token (15m) + rotating,
  bcrypt-hashed refresh token (30d) stored on the `User` row. Customer OTP auth is still Phase 4.
- **Admin token storage**: the admin web app keeps its access/refresh tokens in `localStorage`,
  not an httpOnly cookie. That's a deliberate simplification for an internal-only tool — revisit
  with cookies if this panel is ever exposed beyond trusted staff.
- **One-click approve**: `VehiclesService.approveAndPublish()` walks a listing from wherever it
  sits (`submitted` or `under_review`) all the way to `live` in a single admin action — under the
  hood it still steps through every transition via `VehicleStatusService`, so an already-decided
  listing (e.g. `rejected`) is refused with a clear error rather than silently skipped.
- **Media storage**: `VehicleMedia.storageKey` holds a bucket-relative path, not a full URL —
  `StorageService` (S3-compatible, MinIO locally) resolves it to a URL only when serving a
  vehicle, so the bucket's public base URL can change without a data migration.

## MVP scope

**In MVP (Phases 0–3)**: location-based browsing with fallback, categories, search/filter, vehicle
detail with public ID and verification badge, sell-vehicle submission, admin approval workflow,
enquiry creation, manual agent-handled chat/call, OTP auth.

**Explicitly deferred**: AI-driven chat intelligence, reels, reviews, favorites, push
notifications, dealer accounts.
