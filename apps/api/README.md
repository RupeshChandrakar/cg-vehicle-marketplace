# API

Backend for the marketplace — NestJS, TypeScript, modular monolith. PostgreSQL via Prisma (driver-adapter mode), validated env config, health check.

Runs on **http://localhost:4000**. See the [repo root README](../../README.md) for full setup instructions, including starting the local Postgres/Redis/MinIO stack.

## Scripts

- `pnpm start:dev` — start in watch mode
- `pnpm build` — production build
- `pnpm lint` / `pnpm typecheck` — code quality checks
- `pnpm test` / `pnpm test:e2e` — unit / end-to-end tests (e2e requires the database to be running)
- `pnpm prisma:migrate` — create and apply a migration in development
- `pnpm prisma:studio` — open Prisma Studio

## Structure

- `src/modules/*` — one folder per business domain (health, and more as the marketplace grows)
- `src/infra/*` — shared infrastructure (database, and future adapters for storage/SMS/etc.)
- `src/config/*` — environment validation
- `prisma/schema.prisma` — database schema; `prisma/migrations/` — migration history
