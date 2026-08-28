# Architecture

Used vehicle marketplace for Chhattisgarh — cars, bikes, scooters, tractors, auto-rickshaws,
pickups, trucks, and other commercial vehicles. Customers reach sellers only through the
platform's local agents, never directly.

This document is the reference for how the system is put together. It reflects what is actually
built, not a wishlist — update it as real architectural decisions are made.

## Design language and copy voice

Applied from a mobile design mockup the product owner shared, adapted to responsive web (its
bottom tab bar and full-screen search became a top nav + inline filters — mobile chrome doesn't
translate literally to web):

- **Icons**: `lucide-react` on the customer web app — categories, nav, and trust badges all use
  it rather than hand-maintained inline SVGs.
- **Copy voice**: structural labels (page titles, form field labels, buttons — "Sell Your
  Vehicle", "Vehicle Details", "Location") stay in plain English; supporting copy (taglines,
  helper text, empty/loading/error states, placeholders) uses Hinglish. This mirrors the source
  mockup exactly rather than translating indiscriminately — don't make loading/error copy
  English-only or field labels Hinglish; that would break the established pattern.
- **Trust-signal fields** (RC available, insurance validity, no-challan, non-accident, owner
  count, plus the free-text area/village and preferred-contact-method) live in `Vehicle.specs`,
  validated by `VehicleSpecsDto` — not dedicated columns. `registrationNumber` is the one field
  in there that's genuinely sensitive: `VehiclesService.toPublicSpecs()` strips it before a
  response ever reaches a public endpoint; `toAdminVehicle()` keeps it. If you add another
  sensitive field to specs, it needs the same treatment — specs isn't public-safe by default.

### Visual design system (2026-08-28 refresh)

The first pass at applying the mockup (icons + Hinglish copy + specs fields, above) still read as
"flat/generic" once live — no depth, borders instead of shadows, sharp corners everywhere, a
single flat green. Fixed via a "Soft Ignition" design system (chosen by a 4-proposal / 3-judge
exploration, cross-checked against real computed styles pulled from Spinny/Ola/Uber) applied
across `apps/web`:

- **Font**: `Plus Jakarta Sans` (via `next/font/google`) replaced Geist Sans as the UI typeface —
  a free, geometric-warm font in the same spirit as Spinny's Jost-based identity, without reusing
  anyone's actual asset. `Geist Mono` stays, now used specifically for prices/tabular numbers
  (`font-mono tabular-nums`) — every design proposal explored converged on mono-for-price.
- **Radius hierarchy** (never mixed across tiers): badges/pills = full (`rounded-full`); buttons
  and form inputs = `rounded-lg` (8px); cards (vehicle card, spec tiles, wizard step container) =
  `rounded-xl`/`rounded-2xl`; `rounded-2xl` reserved for hero-scale surfaces only (hero panel,
  detail-page gallery). Primary CTAs (Chat, Post Ad, wizard Continue/Submit, header "Sell Your
  Vehicle") are the one exception at full pill — the most rounded, most confident shape, reserved
  for the single most important action per screen.
- **Shadows over borders**: `--shadow-card` / `--shadow-card-hover` / `--shadow-btn` /
  `--shadow-btn-hover-primary` / `--shadow-float` are dark-tinted (`rgb(23 23 23 / …)`) CSS custom
  properties defined in `globals.css`, exposed as `.shadow-card` etc. utility classes. Cards no
  longer carry a `border` — the shadow alone separates them from the page background, which was
  the single biggest lever for fixing the "flat" complaint.
- **Call vs. Chat color split**: the vehicle detail page's "Call" button is filled Dark (`bg-foreground`)
  while "Chat"/"Post Ad"/wizard actions stay Primary Green — every judge in the design review
  called this out as the real mechanism for "don't overuse green" (two distinct actions get two
  distinct colors, instead of one green button doing every job on the screen).
- **Derived tokens** (additive, the five brief-mandated hex values never changed): `--color-warm`
  (`#fbfaf8`, alternating section backgrounds) and `--color-gold` (`#c4881a`, reserved strictly
  for ratings/"Featured" — not yet used anywhere, held in reserve for Phase 4+).
  `--color-primary-light` remains reserved for small active/selected surfaces, never a full-bleed
  background.
  - **Hero's floating search pill**: `SearchLocationBar` (in `features/search/`, replacing the old
  separate `LocationSelector`/`SearchBar`) merges district selection and search into one pill-
  shaped control. On the home page (no active filters) it renders as `variant="floating"`,
  overlapping the hero panel's bottom edge via a negative top margin on its wrapper — the one
  deliberate "this feels crafted, not templated" moment. With filters active there's no hero
  panel to float over, so it renders as `variant="inline"` (same component, `shadow-card` instead
  of `shadow-float`).
- The **admin app** (`apps/admin`) was deliberately left untouched by this refresh — it's
  internal-only tooling with no mockup coverage. Revisit only if explicitly asked to align it.

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
| Edit listing fields/photos         |    —     |         ✅         |    ✅    |
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
| 3 — Enquiry & Agent Workflow | Enquiry creation, agent assignment, status state machine, basic chat, call logging _(done)_                                                    |
| 4 — Accounts & Engagement    | OTP auth polish, favorites, notifications, reviews _(done)_                                                                                   |
| 5 — Intelligent Chat Layer   | AI orchestration on top of Phase 3's deterministic data — never a source of truth _(done)_     |
| 6 — Reel Studio              | Template-based FFmpeg video generation, only after 1–4 are stable _(done)_                                                                    |
| 7 — Mobile App               | React Native consuming the same API                                                                                                           |

### Phase 4 notes

- **OTP auth**: `CustomerAuthService` (`POST /auth/customer/otp/request` / `/verify`) issues the
  same access+refresh token shape as staff login (`AuthService.issueTokens`, now `public` so both
  paths share it) — a customer session is indistinguishable from staff at the JWT-payload level
  beyond `role: customer`. OTPs are 6-digit (`node:crypto`'s `randomInt`, never `Math.random()`
  for an auth secret), bcrypt-hashed on `User.otpHash` (never stored plaintext), 5-minute TTL,
  30-second resend cooldown, and lock out after 5 wrong attempts until a fresh OTP is requested.
  `SmsProvider` (`infra/sms/`) is a provider-agnostic interface with one implementation,
  `ConsoleSmsProvider`, which prints the OTP via `Logger.warn` — the standard no-op dev transport
  (there's no real phone to deliver to locally), not the same thing as logging a real OTP in
  production; once a real gateway is wired in, this class stops being used entirely.
- **Guests and OTP accounts share history for free**: Phase 3's anonymous enquiry flow and
  Phase 4's OTP accounts both resolve through `UsersService.findOrCreateByPhone` — a customer who
  enquired as a guest sees that same enquiry in `GET /enquiries/me` the moment they log in with
  the same number. No migration or linking step needed.
- **Favorites**: `Favorite` is a simple `(userId, vehicleId)` unique pin. The toggle endpoint
  (`POST /favorites/:vehiclePublicId/toggle`) is deliberately not checked per-card on the browse
  grid (would be one request per card) — only the vehicle detail page calls
  `GET /favorites/:vehiclePublicId` to show the button's true initial state; cards always start
  unfilled and rely on the toggle response.
- **Reviews**: a rating (1-5) targets exactly one of a vehicle or an agent — enforced in
  `ReviewsService`, not the schema (matches the project's existing DTO-level cross-field-rule
  pattern). A review requires the author to actually have an `Enquiry` with that vehicle/agent —
  no drive-by reviews. Resubmitting upserts (`@@unique([authorId, vehicleId])` /
  `[authorId, agentId]`) rather than erroring, so a customer can edit their review by submitting
  again. The "leave a review" prompt lives on the customer's My Enquiries page, shown only once
  an enquiry reaches `closed_won`/`closed_lost`.
- **Notifications**: a single per-user feed (`NotificationsModule`, `@Global()` so
  `VehiclesService`/`EnquiriesService` can create rows without a module-import cycle) — not
  role-restricted. Real triggers only, wired into existing code paths: vehicle
  approved/rejected → notify the seller; enquiry created → notify the assigned agent and the
  seller; a new chat message → notify whichever side didn't send it. No push delivery (FCM) yet —
  in-app feed only, matching this phase's stated scope.

- **Agent assignment**: no district/territory setup exists yet, so a new enquiry is auto-assigned
  to whichever active agent currently carries the fewest open enquiries (`open`/`contacted`/
  `negotiating`) — simple, fair, and needs no configuration. An admin can always reassign via
  `POST /admin/enquiries/:id/assign` (built, not yet wired to an admin UI control — add one if
  agents outgrow this default).
- **Customers stay unauthenticated** in Phase 3, matching the sell flow's precedent: an enquiry
  is created with just name+phone (`UsersService.findOrCreateByPhone`), no OTP session. Real
  customer accounts land in Phase 4.
- **Conversation-access tokens**: because customers aren't authenticated, `EnquiriesService`
  issues a second, narrower *kind* of JWT for chat — `{ type: 'conversation', conversationId,
  customerId }`, 24h TTL — verified manually (`resolveRequesterFromToken`), never through
  `JwtStrategy`/`JwtAuthGuard` (which only ever accepts `type: 'access'`). The public
  `EnquiriesController`'s message endpoints and the `EnquiriesGateway` both accept either this
  token or a normal staff access token, resolving to the same `Requester` union type in
  `enquiries.service.ts`. `AuthModule` re-exports `JwtModule` specifically so `EnquiriesModule`
  can sign/verify off the same `JWT_SECRET` without a second registration.
- **Realtime**: `EnquiriesGateway` (`@nestjs/websockets` + `@nestjs/platform-socket.io`, wired via
  `app.useWebSocketAdapter(new IoAdapter(app))` in `main.ts`) runs one Socket.IO room per enquiry
  (`enquiry:{id}`) at namespace `/enquiries`. `join` resolves the token and authorizes exactly
  like the REST path (`assertCanAccessConversation`) before joining the room; `message` persists
  via the same `EnquiriesService.sendMessage()` REST uses, then broadcasts to the room. The
  customer chat page (`apps/web/src/app/enquiry/[id]/page.tsx`) also does a REST
  `getEnquiryMessages` fetch on mount so history renders immediately, without waiting on the
  socket handshake.
- **State machine**: `EnquiryStatusService` mirrors `VehicleStatusService`'s
  transition-table-service pattern exactly (`open → contacted → negotiating → closed_won` /
  `closed_lost` from any non-terminal state). The admin UI mirrors the same table client-side
  purely to only *offer* valid buttons — the API is the actual authority.
- **Call logging** has no telephony integration — `CreateCallLogDto`/`CallLog` just record an
  outcome + notes for a call an agent made off-platform, for accountability.
- **Admin app was not visually refreshed** in this phase — it keeps the plain
  border/no-shadow style from Phase 2, consistent with the earlier decision to leave the internal
  tool unstyled unless asked. (Refreshed afterward — see "Admin visual refresh" below.)

### Phase 5 notes

Scope was narrowed to one concrete feature (confirmed with the product owner): **agent
reply-assist** inside Phase 3's real enquiry chat. No customer-facing AI search assistant yet —
that's a separate, larger decision left for later.

- **`AiProvider`** (`infra/ai/`) is a provider-agnostic interface — `suggestReply(vehicle,
  messages) => Promise<string>` — mirroring Phase 4's `SmsProvider` pattern exactly.
  `AiModule` is `@Global()` (like `NotificationsModule`) so `EnquiriesService` can inject
  `AI_PROVIDER` without a module-import cycle. Which implementation gets bound is decided once,
  in `AiModule`'s factory: `ClaudeAiProvider` if `ANTHROPIC_API_KEY` is set, otherwise
  `StubAiProvider` — no other code needs to know which one is active.
- **`StubAiProvider`** is the default in this environment (no key configured yet). It's not a
  fake — it builds its templated draft from the *real* vehicle facts and the real last customer
  message (same "never fabricate data" discipline as everywhere else in this codebase), but the
  output always ends with a bracketed `[Draft by stub AI provider — set ANTHROPIC_API_KEY…]`
  label, so it can never be mistaken for genuine model output if it somehow reached a real
  conversation. Has its own spec file (`stub-ai.provider.spec.ts`) — same "small pure logic unit
  gets a dedicated test" pattern as `VehicleStatusService`/`EnquiryStatusService`.
  `ANTHROPIC_API_KEY` is optional in `env.validation.ts`.
- **`ClaudeAiProvider`** is real, complete integration code (`@anthropic-ai/sdk`,
  `claude-sonnet-5`) — just dormant until a key is provided. Its system prompt explicitly
  forbids inventing vehicle facts and forbids ever surfacing the seller's contact details or
  `registrationNumber` (stripped from the prompt before it's built).
- **Never a source of truth, enforced structurally, not just by convention**: `suggestReply()`
  only *returns* a string — it never calls `sendMessage()` or touches the `Message` table itself.
  `POST /admin/enquiries/:id/suggest-reply` (guarded exactly like the other staff enquiry
  endpoints — assigned agent or admin only, via the same `assertStaffCanManage`) returns the
  draft to the browser, which drops it straight into the agent's own message input
  (`ChatPanel`'s "Suggest Reply" button in `apps/admin`). The agent still reviews, can edit
  freely, and sends it themselves through the existing socket `sendMessage` path — a suggestion
  that's never reviewed is never persisted anywhere.

### Phase 6 notes

Confirmed as a "key feature" by the product owner — built as a real pipeline throughout, with
exactly one deliberate exception (actually posting to social platforms), matching the same
stub-the-external-integration pattern as Phase 4's SMS and Phase 5's AI provider.

- **Pipeline** (`ReelsService.generate()`, private, fire-and-forget from `create()`): downloads
  each of the vehicle's real `VehicleMedia` photos from storage
  (`StorageService.download()`, new this phase) → one FFmpeg pass per photo produces a 3-second
  1080×1920 segment (Instagram Reels/YouTube Shorts vertical format) with a burned-in title/price
  overlay → FFmpeg's `concat` demuxer joins the segments (far more robust than one giant
  `filter_complex` graph for a variable photo count) → a real thumbnail frame is extracted via
  `-ss 1 -frames:v 1` → both video and thumbnail upload to the same S3 bucket vehicle photos use,
  under a `reels/` key prefix.
- **Two real templates**, not cosmetic labels — `buildSegmentFilter()` in
  `infra/video/reel-templates.ts`: `classic` (static frame, fade in/out) vs `ken_burns`
  (`zoompan` slow zoom/pan). Both share the same crop-to-vertical and text-overlay treatment.
- **`ffmpeg-static`/`ffprobe-static`** (approved in `pnpm-workspace.yaml`'s `allowBuilds` — they
  need an install-time binary download, same category as `bcrypt`/`prisma`) bundle real prebuilt
  binaries — no system-level FFmpeg install needed, portable across dev machines.
- **Critical Windows gotcha** (see `FfmpegService.toFilterPath()`): FFmpeg's own filtergraph
  syntax uses `:` to separate a filter's options, so a bare Windows drive letter (`C:\...`) used
  as a filter option value (a `fontfile`/`textfile` path) breaks parsing — independent of any
  shell-quoting concern, since `execFile` never goes through a shell. Fix: escape the drive
  letter's colon (`C:` → `C\:`) and use forward slashes throughout. Proven first via raw
  scratchpad `ffmpeg.exe` calls before being wired into the service — worth doing for any future
  filter-graph change, since the failure mode ("Both text and text file provided") is misleading.
- **Text overlays use `textfile=`, not `text=`** — writes the vehicle title/price to small temp
  `.txt` files and references them by path, sidestepping FFmpeg's own quoting rules for
  apostrophes/colons/etc. that a real vehicle title or price string could otherwise contain.
- **`REEL_FONT_PATH`** (required env var, fails fast at boot if missing) points at a real `.ttf`
  file for `drawtext`. Currently a Windows font path in this dev environment
  (`C:\Windows\Fonts\arialbd.ttf`) — deployment (likely Linux) needs a real bundled font file
  instead (e.g. an openly-licensed Google Font shipped under `apps/api/assets/fonts/`).
- **No job queue yet**: generation runs fire-and-forget in the same Node process that handled the
  `POST /admin/reels` request — fine at today's volume (one instance, low concurrent generation),
  but a real BullMQ+Redis queue (Redis is already in the architecture's stack for Socket.IO) is
  the natural next step if concurrent reel generation ever becomes common. The admin UI polls
  `GET /admin/reels/:id` every 3s while any reel shows `status: processing`.
  `POST /admin/reels/:id/publish-status` — `publishStatus` (draft/scheduled/published) and
  `platform` (free-text label, e.g. "instagram") are exactly that: a manual record of what an
  agent/admin says they did after downloading and posting the video themselves. No Instagram/
  Facebook/YouTube API calls exist anywhere in this codebase. Per the original role matrix,
  agents can create reels (always as `draft`) but only admins can move `publishStatus` off draft
  — enforced via a method-level `@Roles(UserRole.admin)` override on that one endpoint.
- **Storage backend note**: this phase is what revealed the local MinIO instance referenced in
  earlier phases had silently died at some point (port 9000 had been reoccupied by an unrelated
  process) — every prior "photo upload" this session had likely never actually been exercised for
  real. Fixed by downloading and running a real MinIO Windows binary on port 9002; see the
  persistent project memory for the full diagnosis and exact commands, since this is a
  local-dev-environment detail rather than an architectural decision.

### Admin visual refresh (2026-08-28)

The product owner shared a full admin-dashboard mockup (dark sidebar, stat cards, donut chart,
tables) with a much bigger sidebar than what actually exists — Buyers, Sellers/Dealers, Reel
Studio, CMS, Social Accounts, Activity Logs, Users & Roles, none of which have any backend. Scope
was deliberately narrowed to: apply the mockup's visual language to what's real, and build a
genuine Dashboard home page — no fabricated sections, no invented numbers.

- **Design tokens**: `apps/admin` now shares the exact same tokens as `apps/web` — Plus Jakarta
  Sans, the `--shadow-card`/`--shadow-btn`/etc. custom properties, the `--color-warm`/
  `--color-gold` derived tones, the same radius hierarchy (pill buttons/badges, rounded-lg
  inputs, rounded-2xl cards). One consistent look across both surfaces now, not two.
- **Shell**: `AdminShell` (`components/admin-shell.tsx`) replaced the old flat `SiteHeader` with
  a persistent dark sidebar (`components/sidebar.tsx`, `bg-foreground`) + light top bar
  (`components/top-bar.tsx`). The shell renders bare (no chrome) on `/login` and pre-hydration —
  checked by `pathname === '/login' || !user`, not a Next.js route group, since that would've
  meant restructuring every existing route. Sidebar nav is real items only: Dashboard, Vehicle
  Queue, Enquiries (live open-count badge), Notifications (live unread-count badge, shared with
  the top bar's bell via `useUnreadNotifications()`).
- **Dashboard** (`app/page.tsx`, previously just a redirect to `/queue` or `/login`): genuine
  stats computed client-side from one `pageSize=50` fetch each of `/admin/vehicles` and
  `/admin/enquiries` (both endpoints already return `meta.total` and support `pageSize`, extended
  this refresh) — no dedicated aggregation endpoint exists yet. **Known scaling limit**: counts
  are only accurate up to 50 records per entity; replace with a real count/aggregate endpoint
  once vehicle or enquiry volume exceeds that. The donut chart is a dependency-free CSS
  `conic-gradient`, not a charting library — proportionate to one chart on one page.
  Total-Users, Reel Studio, Top-Vehicles-by-Enquiries, and the time-series Listings-Overview
  chart from the mockup were all left out — no backend support (Users listing, enquiry-by-vehicle
  aggregation, day-bucketed listing history) exists for any of them yet.

### Admin listing edit (2026-08-28)

A direct product gap, not a planned phase: there was no way for admin/agent to correct a listing
after submission (price typo, missing photo, wrong spec) short of rejecting it outright. Approve/
reject were the only admin actions on a `Vehicle` until now.

- **`PATCH /admin/vehicles/:id`** (`VehiclesService.update()`) — every field optional, seller
  identity (`sellerName`/`sellerPhone`) deliberately excluded (reassigning a listing to a different
  seller is a different, unsupported operation). Same admin+agent role guard as approve/reject.
  **Not** part of the status state machine — editing a `live` listing applies immediately, no
  forced re-review, since admin/agent are already the trusted verifying party.
- **`specs` is merged, not replaced** — a partial update (e.g. just `{ rcAvailable: true }`)
  leaves other trust fields (`registrationNumber`, `insuranceValidUntil`, etc.) untouched. Caught a
  real bug here during verification: `UpdateVehicleDto`'s nested `VehicleSpecsDto` is a class
  instance, and under this project's `ES2023` target (`useDefineForClassFields`), every declared
  field exists as an own property even when the caller didn't send it — explicitly set to
  `undefined`. A naive `{...existingSpecs, ...dto.specs}` spread let those explicit `undefined`s
  clobber previously-set fields (unlike `JSON.stringify`, plain object spread does not drop
  `undefined` values). Fixed by filtering `dto.specs`'s entries to defined values before merging.
- **Admin-only photo curation**, separate from the customer-facing upload path: new
  `AdminVehicleMediaController` at `/admin/vehicles/:id/media` (`POST` add, `POST .../reorder`,
  `DELETE .../:mediaId`) works regardless of listing status, including `live`. The existing
  customer-facing `POST /vehicles/:id/media` is unchanged — still restricted to
  draft/submitted/under_review. `VehicleMediaService` now has a shared private `uploadFiles()`
  helper so the two paths (status-checked vs staff-bypassed) don't duplicate the upload logic.
  Photo delete now genuinely removes the S3 object (`StorageService.delete()`, new this feature) —
  not just the DB row, avoiding orphaned storage objects.
- **Admin UI**: `/queue/[id]/edit` (new page) — full field-edit form plus a photo grid with
  add/remove/reorder (simple up/down buttons rather than drag-and-drop, given the low photo count
  ceiling of 10). Reachable via an "Edit" link on every Vehicle Queue card, including `live` ones
  under that filter tab, not just pending ones.
- Verified end-to-end against the real dev stack (real Postgres, real MinIO, real running admin
  app under Puppeteer): price/description/specs edit persists across a page reload; staff photo
  upload/reorder/delete all work on a `live` vehicle; the public vehicle-detail endpoint reflects
  the edit immediately with `registrationNumber` still stripped; the customer-facing upload
  restriction on a `live` vehicle is unregressed (still 400s).

### Visit & vehicle-view analytics (2026-08-28)

PO asked whether visits and per-vehicle clicks can be tracked — a real gap: no analytics table
existed anywhere in the schema before this. Scoped to exactly what was asked (site-wide unique
visitors + a per-vehicle view leaderboard), not the broader views→enquiry-conversion option also
offered.

- **One event table, `PageView`** (`sessionId`, `path`, optional `vehicleId`, `createdAt`) backs
  both metrics from the same stream rather than two separate mechanisms: `COUNT(DISTINCT
  session_id)` over all rows gives unique visitors; the same count grouped by `vehicleId` gives
  the per-vehicle leaderboard.
- **Anonymous by design**: `sessionId` is a client-generated UUID (`crypto.randomUUID()`) kept in
  the browser's `localStorage` (`apps/web/src/lib/analytics.ts`) — no cookie set by the API, no
  account, no PII. Sidesteps cross-origin cookie configuration entirely between the web app and
  API, which run on separate origins even in dev.
- **One event per page view, not two**: `AnalyticsTracker` (mounted once in the root layout)
  fires on every route change except `/vehicle/*` paths; `VehicleViewTracker` (embedded in the
  vehicle detail page) reports those instead, tagged with the vehicle's public ID. This avoids
  a vehicle-page visit generating both a generic and a vehicle-tagged row for the same visit.
- **Public ID, not the internal UUID**: the tracking payload carries `vehiclePublicId`, resolved
  to the internal `id` server-side in `AnalyticsService.trackPageView` — same convention as
  Favorites/Enquiries, despite `Vehicle.id` technically already appearing in the public API
  response (a pre-existing minor inconsistency, not introduced here). An unknown/stale
  `vehiclePublicId` is silently dropped (event still recorded, just without the vehicle tag)
  rather than rejecting the whole request.
- **`COUNT(DISTINCT session_id)` per vehicle** can't be expressed through Prisma's `groupBy`
  (no distinct-within-group support) — the same gap the approval pipeline hits for
  `vehicle_public_id_seq`'s `nextval`, so `AnalyticsService.getMostViewedVehicles()` goes through
  one parameterized `$queryRaw`, then joins the result back to real `Vehicle` rows for
  title/status/publicId.
- **`POST /analytics/page-view` is public and unrate-limited** — consistent with every other
  public endpoint in this codebase (none have rate limiting yet), but worth flagging here since
  an anonymous write endpoint is a more obvious abuse target than a read endpoint. Add
  `@nestjs/throttler` (or equivalent) globally if this becomes a real concern, rather than
  bolting a one-off limiter onto just this route.
- **Own sidebar page, not folded into the Dashboard**: `/analytics` (nav item right after
  Enquiries) — a "Visitors Today/This Week/All-Time" stat row plus a "Most Viewed Vehicles" table
  (top 10 by unique viewers), both fed by `GET /admin/analytics/summary` (admin+agent). Initially
  built inline on the Dashboard, then moved out to its own page per PO feedback — kept as a
  distinct concern from the vehicle/enquiry operational stats the Dashboard is otherwise about.
- Verified end-to-end against the real dev stack: a REST script covering session-dedup
  correctness (repeat views from one session count once), tampered/unknown vehicle ID handling,
  and DTO validation; five separate live-browser runs (fresh browser context each time, so a
  genuinely new "visitor") each showed the Dashboard's visitor counts increment by exactly one
  per real customer-app page visit.

### Growth: WhatsApp share & referral tracking (2026-08-28)

PO asked how to bring more users in and eventually monetize. Two separate concerns — traffic
(growth) and revenue (monetization) — and PO explicitly chose growth first: premature paywalls
before any real traffic/trust exist tend to suppress the adoption they're meant to fund.
Deliberately scoped to genuinely free, low-effort growth mechanics; no monetization work landed
here.

- **WhatsApp share** (`WhatsAppShareButton`, vehicle detail page): builds the `wa.me` link and
  share message **on click**, reading `window.location.href` — always the exact correct absolute
  URL for that visit, in dev or prod, with no `metadataBase`/site-URL env var needed.
- **Referral tracking, not a "refer & earn" reward system**: `User` gained `referralCode`
  (nullable, unique, generated lazily on first `GET /users/me/referral` rather than backfilled —
  avoids a unique-column backfill migration for a field most existing rows will never touch) and
  `referredById` (set once, at account creation, never overwritten). No payment/wallet
  infrastructure exists anywhere in this codebase, so this deliberately does **not** promise a
  cashback/credit reward to referrers — building that UI without a real ledger behind it would be
  exactly the kind of fabrication this project avoids. The customer-web `/refer` ("Invite
  Friends") page frames it as inviting friends, not earning a reward.
- **Attribution point matters**: `UsersService.findOrCreateByPhone()` is the one place a referral
  code is ever consulted — specifically its `create` branch of the upsert, so a *returning* user
  can never be re-attributed, and a code can't attribute a user to themselves (checked by phone).
  `requestOtp()` is the natural place for this (not `verifyOtp()`) since `findOrCreateByPhone`
  already runs there, creating the row before the OTP is even confirmed.
- **Capture is deliberately not next/navigation's `useSearchParams()`**: that hook forces
  whatever imports it out of static rendering, and `ReferralCapture` is mounted in the root layout
  — every page. It reads `window.location.search` directly instead (matching
  `AnalyticsTracker`'s existing `usePathname()`-triggered pattern), stores the code in
  `localStorage`, and the login page reads it back when calling `requestOtp()` — a visitor can
  land on a shared link, browse a while, and sign up later, not just immediately.
- Verified end-to-end for real: a REST script drove the actual `/auth/customer/otp/*` endpoints
  with a real bcrypt-hashed OTP override (direct DB write, matching the app's own hashing) to
  complete two real signups without touching the shared dev server's console — confirmed
  attribution, the referrer's count incrementing, and the self-referral guard holding. A
  browser-level pass confirmed the `?ref=` capture, that `requestOtp()`'s network payload actually
  carries the stored code, the WhatsApp share button's exact message content, and the `/refer`
  page rendering a real referrer's real link and count.

### WhatsApp new-listings digest (2026-08-28)

Follow-up to the WhatsApp share button: PO asked about auto-posting a vehicle directly into a
WhatsApp group. Answered honestly rather than building it — **WhatsApp's official Business API
does not support posting into groups at all** (by design, to prevent spam; it only supports
1:1 messaging with opted-in users), and the unofficial ways to automate a real WhatsApp account
into a group violate WhatsApp's ToS and risk that number getting permanently banned. Not
something to build for a real business. Every major marketplace (OLX, Cars24, Spinny) relies on
the same manual-share pattern for exactly this reason.

Given that, PO chose the practical alternative: make *manual* group-sharing faster for bulk
listings rather than one vehicle at a time.

- **Vehicle Queue → "live" tab** gained a per-card checkbox (only on `live` listings — a digest
  of anything else isn't something a customer could actually view). A floating bottom bar appears
  once 1+ are selected: "N listings selected" + Clear + "Create WhatsApp Digest".
- The digest button builds one WhatsApp message bundling every selected vehicle (numbered,
  bold title, price, district, and a real clickable link to that vehicle's public detail page)
  and opens it via `wa.me` — admin pastes it into as many groups as they want in one motion,
  instead of repeating the single-vehicle share per listing.
- **New `CUSTOMER_WEB_URL` config** (`apps/admin/src/config/site.ts`,
  `NEXT_PUBLIC_CUSTOMER_WEB_URL`, defaults to `http://localhost:3000`) — the first place the admin
  app needed to know where the *customer* web app lives, to build a real link into someone else's
  origin.
- Selection state clears automatically on filter-tab change (a selected ID from the `live` tab
  would otherwise sit invisibly selected after switching to `rejected`).
- Verified live: selected 2 real live vehicles, captured the actual `window.open()` call, and
  confirmed the decoded message content — correct brand name, both numbered entries, both real
  vehicle links.

### Finance lead capture — not a lending product (2026-08-28)

PO asked to advertise financing with a specific "0% down payment" claim and a banner. Flagged
this honestly rather than building it as asked: there is no real bank/NBFC partnership behind
this platform, and advertising a specific credit term (0% down payment is unusually aggressive
even for a real lender — used vehicles are depreciated collateral, so real lenders typically
require 15–30% down) with no lender actually backing it is a **misleading-advertisement risk**,
not just a copy-writing choice — India's RBI advertising code for credit products and the
Consumer Protection Act both bear on this. The khetigaadi.com review done earlier the same day
directly informed this: their own finance page, despite real bank-partner logos, never claims a
specific guaranteed rate or down-payment figure anywhere — it's a generic enquiry funnel. PO
agreed to build the honest version instead.

- **`FinanceEnquiry` model is pure lead capture** — name, phone, optional message, optional
  `vehicleId`, status (`new`/`contacted`/`closed`). No loan application, no bank integration, no
  approval/underwriting logic anywhere. `onDelete: SetNull` on the vehicle relation (not
  `Cascade`, unlike `PageView`/`Reel`) — deliberate: this is lead data with its own business
  value independent of whether the vehicle listing later disappears.
- **`POST /finance-enquiries`** (public) — the vehicle detail page's "Financing Available" banner
  submits here. Same `vehiclePublicId`-resolved-server-side convention as
  Favorites/Enquiries/Analytics/the referral system; an unknown/stale one is dropped rather than
  failing the submission.
- **`GET /admin/finance-enquiries` / `POST /admin/finance-enquiries/:id/status`** (admin+agent) —
  new `/finance-leads` admin page (sidebar, right after Enquiries) lists leads with a status
  filter and a per-lead status dropdown for manual follow-up. The page's own copy says outright:
  "Ye pure lead-capture hai — koi bank/NBFC integration nahi hai" — never let the internal tooling
  imply more automation than exists either.
- **Banner copy is deliberately generic**: "Financing Available — enquire karein," no rate, no
  down-payment percentage, no lender name. If a real bank/NBFC partnership is ever signed, this
  copy (and only this copy) should change to reflect that partner's actual, confirmed terms —
  never the other way around.
- **Bug found and fixed during verification, not specific to this feature**: `apps/web`'s shared
  `request()` helper never handled a `204 No Content` response — it always called
  `response.json()`, which throws on an empty body. Every prior web-app API call happened to
  return a JSON body, so this was latent and untriggered; `submitFinanceEnquiry()` (backed by a
  204 endpoint) was the first caller to hit it. Fixed by adding the same `response.status === 204`
  short-circuit `apps/admin`'s `request()` already had. The underlying POST had actually already
  succeeded server-side each time — the bug was purely in the client's response handling, not
  data loss — confirmed by finding the "failed" test's lead already present in the admin list.
- Verified end-to-end: a REST script (vehicle-tied lead, generic lead, tampered vehicle ID
  dropped gracefully, invalid phone rejected, status update, auth-required on the admin list) and
  a live browser pass (banner → form → real submission → confirmation copy, then the same lead
  visible on the real admin Finance Leads page reached via actual sidebar navigation).

### Home hero promo ticker (2026-08-28)

PO asked for a lightweight, auto-rotating promotional banner near the "Sahi Gaadi, Sahi Daam"
hero tagline — something that cycles on its own rather than a static line.

- **`PromoTicker`** (`apps/web/src/features/home/promo-ticker.tsx`) replaces the old static "500+
  Verified Sellers" badge in that exact spot on the home hero, cycling through 5 short messages
  every 4 seconds via a plain `setInterval` — no carousel library. Pauses on hover so a message
  doesn't swap out from under someone mid-read.
- **Every message maps to a real, already-shipped feature** — verified sellers, financing
  enquiry, listing verification badges, referral/invite, agent chat/call — never a placeholder or
  aspirational claim. The component's own comment states this as a rule: add a message only once
  its feature is live, remove it the moment the feature is retired.
- **Transition is a small fade+slide (`animate-promo-fade-in` in globals.css), not a marquee
  scroll** — replaying via a React `key` remount on each rotation. Deliberately restrained to
  match this app's existing motion language, rather than a dated blinking-ticker look.
- **Background got a follow-up pass** (same day, PO feedback: "message thik hai, background bhi
  attractive karo") — a soft diagonal gradient plus a periodic light-sweep shimmer on the badge
  itself, built entirely from the fixed brand palette: the gradient blends in `--color-primary`
  at low opacity (`rgb(22 138 69 / 0.12)`) rather than pure `--color-primary-light`, specifically
  because `--color-primary-light` alone is nearly white — too close to the white shimmer sweep's
  own color to read as visible motion against. Deliberately did not reach for `--color-gold` here
  even though a warm accent might have looked "extra attractive" — the design-language rule
  reserves gold strictly for ratings/"Featured" callouts so it never dilutes green's action/trust
  meaning, and a rotating hero badge isn't that. A `prefers-reduced-motion` guard turns the
  shimmer off entirely for users who've asked for less motion.
- Verified live: confirmed the badge text actually changes across three consecutive rotation
  intervals, that hovering over the badge holds the current message rather than rotating, and —
  since a moving shimmer is inherently hard to prove from a still screenshot — confirmed the
  shimmer's actual `transform: translateX(...)` computed value sweeping from -407px to +407px
  over its cycle by sampling it programmatically over time, not just eyeballing a screenshot.
- **A second follow-up, same day** — PO clarified "background" meant the whole hero *card*
  behind "Sahi Gaadi, Sahi Daam", not just the small badge. That card was a completely flat
  `bg-primary-light` fill before this. Replaced with `.hero-background` (a diagonal gradient
  using the same low-opacity `--color-primary` tinting trick as the badge) plus two large,
  blurred, `aria-hidden` decorative "blob" accents (`.hero-blob-a`/`.hero-blob-b`) positioned
  behind the actual heading/copy via `z-10`, with the card given `overflow-hidden` so the blobs
  never spill past its rounded corners. Purely decorative and never interactive — verified the
  heading/paragraph/CTA all render at full contrast on top of it, unaffected.
- **A third follow-up** — PO asked to see several full-card background directions before
  deciding. Built 5 as a temporary `/hero-preview` comparison route (not linked anywhere, deleted
  once the decision was made): the soft-blobs one above, a dot grid, diagonal hairline stripes, a
  radial spotlight, and a "road motif" (a dark diagonal strip with dashed lane markings). The road
  motif was **rejected on review** — the dark strip crossed the paragraph text and visibly hurt
  its legibility, a real problem, not a style preference.
- **`RotatingHeroCard`** — PO's final call: keep all 4 approved looks live, cycling automatically
  rather than picking one. Rotates every 8s (deliberately slower than `PromoTicker`'s own 4s text
  rotation, so the card doesn't read as everything changing on the same beat). The background is
  a separate, absolutely-positioned layer that remounts via a React `key` each rotation (to
  replay `animate-hero-bg-fade-in`); the heading/`PromoTicker`/CTA live in a sibling div that
  never remounts — this matters because remounting `PromoTicker` itself would reset its own
  independent rotation timer every time the background changed. Verified live by sampling both
  the background's class and the promo badge's text every ~4.2s over a 21s window: the background
  visibly advanced through 3 distinct variants, and the promo text advanced through all 5
  messages, on their own independent schedules with neither disrupting the other.

### Category tile design matched to the mobile mockup (2026-08-28)

PO re-shared the original mobile-app mockup (the same one behind the 2026-08-28 web design
refresh — see "Design direction" earlier) and asked to match the home screen's "Categories"
section specifically, which the earlier refresh hadn't precisely carried over.

- **Neutral at rest, green only when selected**: the mockup's category tiles are white cards with
  simple dark-outline icons — not the bold green-filled squares this app had. Changed
  `CategoryFilter`'s inactive state to `bg-background text-foreground` (matching the mockup);
  kept the active/currently-filtered state as `bg-primary text-white` — the mockup's static
  screenshot has no filter applied, so there was nothing to copy for that state, but keeping a
  clear "this is selected" signal is a real interaction need the mockup didn't have to solve.
  This also fits the standing design rule from the earlier refresh: green is reserved for actions/
  active state, not default browsing chrome.
- Added a plain "Categories" section heading above the tile row, matching the mockup — a
  **"View All" link was deliberately not added** even though the mockup has one: on mobile it
  expands a truncated category list, but the web version already shows every category inline, so
  a "View All" link here would have nowhere real to go.
- Verified live: the new white/dark-icon tiles render correctly, the "Categories" heading is
  present, and clicking a tile still correctly applies the green active state and filters results
  (confirmed against a real category with real listings).
- **Two follow-up rounds, same day**: PO wasn't satisfied — first asked for the flat-gray "chip"
  look specifically (the white-card version above read too close to the page background; changed
  to `.category-chip`, `rgb(23 23 23 / 0.05)`, no shadow). Then shared a *second* reference image —
  a colorful flat-illustration vehicle icon set (bicycle/truck/scooter/car/tow-truck/bus, each in
  a distinct bright color) — and asked to match that instead.
- **Told honestly rather than faked**: that reference is a commercial/purchased stock illustration
  set — there's no license to reproduce it pixel-for-pixel, and fabricating a "same but not
  actually the same" copy would misrepresent its source. The practical, license-clean equivalent:
  real platform vehicle emoji (🚗🏍️🛵🚜🛺🛻🚛🚌🚙 per category) — colorful and instantly
  recognizable for the same reason the reference was, with zero licensing risk and zero new
  asset/dependency weight. `getCategoryEmoji()` added alongside the existing lucide-based
  `getCategoryIcon()` (kept for any future monochrome use) in `category-icons.tsx`. Applied to
  both `CategoryFilter` (home page) and the sell wizard's vehicle-type picker, for a consistent
  look everywhere a category is chosen, not just the one place that prompted it.

### Seller self-service — "My Listings" (2026-08-28)

PO asked whether to build a "Dealer Panel." Honest framing before scoping it: today **no
seller, individual or dealer, can log in and see anything about their own listing** — not its
status, not why it was rejected, nothing. Admin can already edit any listing (the earlier
"Admin listing edit" feature); the seller side had zero self-service. PO's call: build the
general "My Listings" foundation first (any seller, not a dealer-specific tier), since a real
dealer subscription/multi-listing tier would sit on top of this later.

- **The auth already existed** — a seller's `User` row is the exact same row created by
  `findOrCreateByPhone()` during `POST /vehicles` (the sell flow), so the existing customer OTP
  login (Phase 4) works unmodified for sellers logging back in later. No new auth mechanism
  needed, only a new self-service surface on top of it.
- **`GET /vehicles/me`** (customer-authenticated) — every vehicle the caller has ever submitted,
  any status, via a new `SellerVehicle` type: same shape as `PublicVehicle` (no nested `seller`
  object — the seller already *is* the viewer) but with raw specs (their own registrationNumber
  included — only the buyer-facing view strips it) plus `status`/`rejectionReason`.
- **`PATCH /vehicles/me/:id`** (customer-authenticated) — a seller can edit their own listing
  **only** while it's in `SELLER_EDITABLE_STATUSES` (draft/submitted/under_review, a new shared
  constant in `vehicle-lifecycle.constants.ts` — extracted specifically so `VehiclesService` and
  `VehicleMediaService` can't drift out of sync on this boundary). Once live/approved, only
  admin/agent can edit it (the existing admin-edit feature) — letting a seller silently change
  price/specs after staff verification would undermine the verification itself. A mismatched
  `sellerId` throws `NotFoundException`, not `Forbidden` — a seller probing listing IDs shouldn't
  be able to tell someone else's listing exists at all (same reasoning as the admin listing-edit
  feature's ownership checks).
- **Refactored, not duplicated**: `AdminVehiclesController`'s `update()` and the new
  `updateAsSeller()` now share one `applyVehicleUpdate()` private helper (generic over the
  Prisma `include` shape each caller needs back) for the actual category/location resolution +
  specs-merge logic — each caller does its own authorization/status-gating *before* calling it,
  so the specs-merge-bug fix from the admin-edit feature automatically applies to seller edits
  too, with no risk of the two implementations drifting apart.
- **Photo management**: adding a photo reuses the *existing* public `POST /vehicles/:id/media`
  endpoint unchanged (it already works during the anonymous sell-wizard flow with no login, and
  still correctly enforces the same status gate). Removing one needed a **new** authenticated,
  ownership-checked endpoint (`DELETE /vehicles/:id/media/:mediaId`, customer role) — deleting
  happens from a *later, separate* "My Listings" session, unlike the original upload which
  happens inline during the same uninterrupted guest submission flow, so it genuinely needs real
  proof of ownership rather than just "knows the vehicle id." Reordering was left out of this
  pass (admin already has it; a seller self-service version is a reasonable future add, not
  requested here).
- **New customer-web pages**: `/my-listings` (status pills, thumbnail, rejection reason if
  rejected, an Edit link when editable or a link to the live listing once it isn't) and
  `/my-listings/[id]/edit` (full field form + photo add/remove, styled like the admin edit page
  but in the customer app's own tokens/Hinglish copy). No dedicated "fetch one listing" endpoint
  was added — the edit page fetches the whole list and finds the one it needs client-side, an
  acceptable shortcut at the realistic number of listings one seller has; revisit only if that
  stops being true.
- Verified end-to-end with a real seller: submitted a vehicle publicly, OTP-logged in as that
  same phone, confirmed `/vehicles/me` scoping, edited price/description while pending, confirmed
  a *different* seller gets a 404 (not 403) trying to edit it, uploaded and then removed a photo,
  had admin approve the listing to live, and confirmed the now-live listing can no longer be
  self-edited (400) while still showing correctly (with its real publicId) in `/vehicles/me`. A
  full browser pass confirmed the same flow through the actual UI, including that a price edit
  survives a page reload.

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
