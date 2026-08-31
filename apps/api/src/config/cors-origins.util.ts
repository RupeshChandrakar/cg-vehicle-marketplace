/**
 * Splits the comma-separated CORS_ORIGINS env var into a trimmed origin
 * list. Shared by main.ts (REST) and EnquiriesGateway (Socket.IO) so both
 * stay in sync with one source of truth instead of drifting independently.
 *
 * Read directly from process.env rather than via an injected ConfigService:
 * EnquiriesGateway's `cors` option is evaluated by the @WebSocketGateway
 * decorator at module-import time, before Nest's DI container exists — so
 * main.ts loads `dotenv/config` as its very first import specifically to
 * guarantee process.env is already populated by the time that decorator runs.
 */
export function getCorsOrigins(): string[] {
  return (
    process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
