# CG Vehicle Marketplace

Used vehicle marketplace for Chhattisgarh — cars, bikes, scooters, tractors, auto-rickshaws,
pickups, trucks, and other commercial vehicles.

Brand name is not final — see [`packages/shared-config/src/brand.ts`](packages/shared-config/src/brand.ts).

Full architecture, database entity map, and role/permission matrix: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Apps

| App             | Path         | Dev URL               | Stack                                 |
| --------------- | ------------ | --------------------- | ------------------------------------- |
| Customer web    | `apps/web`   | http://localhost:3000 | Next.js, TypeScript, Tailwind         |
| Admin/agent web | `apps/admin` | http://localhost:3001 | Next.js, TypeScript, Tailwind         |
| API             | `apps/api`   | http://localhost:4000 | NestJS, TypeScript, Prisma/PostgreSQL |

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm` if you don't have it)
- Docker Desktop (for local PostgreSQL, Redis, MinIO)

## Setup

```bash
# 1. Install dependencies for every app/package
pnpm install

# 2. Start local infrastructure (Postgres, Redis, MinIO)
docker compose up -d

# 3. Configure the API's environment
cp apps/api/.env.example apps/api/.env
# defaults already match docker-compose.yml — edit only if you changed it

# 4. Apply migrations and seed sample data (categories, districts, sample
#    vehicles, and one dev admin account — see "Seeded admin account" below)
cd apps/api && pnpm prisma:migrate && pnpm db:seed && cd ../..

# 5. Run every app in dev mode
pnpm dev
```

Or run a single app: `pnpm --filter web dev`, `pnpm --filter admin dev`, `pnpm --filter api dev`.

## Key pages

| Page               | URL                         |
| ------------------ | --------------------------- |
| Browse vehicles    | http://localhost:3000       |
| Sell a vehicle     | http://localhost:3000/sell  |
| Admin/agent login  | http://localhost:3001/login |
| Admin review queue | http://localhost:3001/queue |

### Seeded admin account

The seed script creates one dev admin account from `apps/api/.env`'s `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` (defaults: `admin@cgautomarket.local` / `ChangeMe123!`) — use it to sign
in at `/login` on the admin app. Never reuse these defaults outside local development.

## Common commands

Run from the repo root, applied across every app/package via Turborepo:

```bash
pnpm lint        # lint everything
pnpm typecheck   # type-check everything
pnpm build       # production build everything
pnpm format      # apply Prettier formatting
```

Scope any command to one project with `--filter`, e.g. `pnpm --filter api test`.

## Database

The API uses Prisma 7 against PostgreSQL, connected through the `@prisma/adapter-pg` driver
adapter (Prisma 7 has no bundled query engine). Common commands, run from `apps/api`:

```bash
pnpm prisma:migrate   # create and apply a migration in development
pnpm db:seed          # seed categories, districts, sample vehicles, and a dev admin account
pnpm prisma:studio    # browse the database
```

## Repository layout

```
apps/
  web/      customer-facing marketplace site
  admin/    internal admin/agent console
  api/      backend (modular monolith)
packages/
  shared-config/   brand identity — single source of truth
docker-compose.yml local Postgres, Redis, MinIO
docs/ARCHITECTURE.md
```
