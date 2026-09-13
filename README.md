# EquipChain Frontend

A production-grade Next.js dashboard for utility metering and billing on
[Stellar Soroban](https://soroban.stellar.org). Operators register meters,
monitor live consumption streams, track invoices, and manage the XLM gas
reserve that funds on-chain transactions — with full offline support when
connectivity drops.

The frontend is fully typed end-to-end, renders against a fixture-backed
data layer today, and integrates with the
[EquipChain backend](https://github.com/EquipChain/EquipChain-backend) and
[contracts](https://github.com/EquipChain/EquipChain-contracts) through
single, marked seams.

---

## Feature Overview

| Area               | Capabilities                                                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**      | Aggregate stat cards, 30-day consumption chart (lazy-loaded recharts), per-utility breakdown, gas-buffer health with critical-floor alerts, overdue-invoice alerts linked to Billing                                            |
| **Meters**         | Sortable/searchable/paginated table, register-meter and submit-reading forms with zod validation, searchable meter picker (WAI-ARIA combobox), per-meter detail page with reading-history and daily/weekly/monthly usage charts |
| **Billing**        | Typed invoice table with outstanding/paid aggregates, per-invoice detail modal, print-only-invoice view, CSV/JSON/PDF export                                                                                                    |
| **Streams**        | Live status indicators, self-refreshing relative timestamps, per-status filters (Streaming / Paused / Failed / Offline)                                                                                                         |
| **Offline**        | IndexedDB operation queue, automatic drain on reconnect, manual Sync-now, queued-operation panel with per-item removal, `/offline` fallback page                                                                                |
| **PWA**            | Installable (generated icons + manifest), Serwist service worker with precache, stale-while-revalidate API caching, navigation fallback                                                                                         |
| **Navigation**     | Persistent AppShell, Ctrl/Cmd+K command palette, press-`?` shortcut reference, vim-style `g d/m/b/s` section jumps, breadcrumbs                                                                                                 |
| **Export**         | Column selection, date-range filtering, clipboard delivery mode, CSV formula-injection neutralization, size warnings for large datasets                                                                                         |
| **Theming & a11y** | Light/dark/system theme with SSR cookie (no flash), reduced-motion support, skip link, focus trapping, ARIA-wired primitives throughout                                                                                         |

## Tech Stack

| Layer     | Technology                                                                            |
| --------- | ------------------------------------------------------------------------------------- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, webpack), React 19, TypeScript 5        |
| Styling   | Tailwind CSS 4, CSS custom-property design tokens, `tailwind-merge` + `clsx` (`cn()`) |
| Data      | SWR 2, typed fetch client (`ApiError`, timeouts), zod 4 validation                    |
| Offline   | IndexedDB via `idb`, Serwist 9 service worker                                         |
| Charts    | Recharts 3, dynamically imported in per-page chunks                                   |
| Dates     | `date-fns` + `Intl.DateTimeFormat` (locale-aware, UTC-pinned)                         |
| Testing   | Vitest 3 + Testing Library (jsdom), Playwright (integration)                          |
| Icons     | lucide-react                                                                          |

## Getting Started

### Prerequisites

- **Node.js 20** (see `.nvmrc`) — `nvm use`
- npm 10+
- Docker (only for the Soroban integration harness)

### Install & run

```bash
npm install
npm run dev          # http://localhost:3000
```

The app runs entirely on fixture data out of the box — no backend required.
All environment variables have safe defaults; see the table below for what
to set before deploying.

### Environment variables

Public variables are validated at **build time** by
`src/lib/security/env.ts` (zod schemas in `next.config.ts`), which also
scans `NEXT_PUBLIC_*` values for secret-shaped strings and fails the
production build on a leak.

| Variable                      | Scope  | Default                 | Purpose                                                                         |
| ----------------------------- | ------ | ----------------------- | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_BASE_URL`        | public | `http://localhost:3000` | Canonical URL for metadata, sitemap, robots, JSON-LD                            |
| `NEXT_PUBLIC_STELLAR_NETWORK` | public | `testnet`               | `testnet` \| `pubnet` \| `futurenet`                                            |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | public | —                       | Soroban RPC endpoint used by the integration harness                            |
| `NEXT_PUBLIC_HORIZON_URL`     | public | —                       | Horizon API endpoint                                                            |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | public | —                       | Stellar RPC endpoint                                                            |
| `BACKEND_URL`                 | server | `http://localhost:3001` | Backend origin; `/api/*` rewrites proxy here                                    |
| `CSRF_SECRET`                 | server | —                       | HMAC key for CSRF token pairs (≥ 32 chars; required in production)              |
| `DATABASE_URL`                | server | —                       | Reserved for backend-coordinated deployments                                    |
| `STELLAR_SECRET_KEY`          | server | —                       | Server-side signing key (`S…`, 56 chars) — **never** prefix with `NEXT_PUBLIC_` |
| `API_RATE_LIMIT`              | server | `100`                   | Requests per window on rate-limited API routes                                  |
| `EXPORT_MAX_RECORDS`          | server | `50000`                 | Hard cap on export row counts                                                   |

Create a `.env.local` for local overrides:

```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_STELLAR_NETWORK=testnet
BACKEND_URL=http://localhost:3001
CSRF_SECRET=local-development-secret-at-least-32-chars
```

## Scripts

| Command                           | What it does                                                                                        |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Dev server (webpack) with Serwist disabled                                                          |
| `npm run build` / `npm start`     | Production build / serve                                                                            |
| `npm run typecheck`               | `tsc --noEmit`                                                                                      |
| `npm run lint`                    | ESLint (next config + react-hooks rules)                                                            |
| `npm test` / `npm run test:watch` | Vitest unit suite / watch mode                                                                      |
| `npm run test:coverage`           | Vitest with v8 coverage (`src/lib`, `src/components`)                                               |
| `npm run test:integration`        | Playwright against a local Soroban node (see below)                                                 |
| `npm run validate`                | typecheck + lint + build — the pre-push gate                                                        |
| `npm run analyze`                 | Production build with bundle analysis (`ANALYZE=true`)                                              |
| `npm run format` / `format:check` | Prettier over `ts/tsx/css/mjs`                                                                      |
| `npm run gen:contracts`           | Generate TS types from Soroban contract specs (`contract-specs/`)                                   |
| `npm run gen:api`                 | Generate API types from `../backend/openapi.json` (requires the backend repo as a sibling checkout) |
| `npm run dev:proxy`               | `next dev` + custom proxy placeholder (rewrites usually suffice)                                    |
| `npm run storybook`               | Component workshop on port 6006 (add `.storybook/` config to use)                                   |

Pre-commit hooks (husky) run typecheck and lint on every commit.

## Architecture

```
app/                        # App Router: server components + client islands
  layout.tsx                # Theme (SSR cookie), ToastProvider, SW registration, AppShell
  dashboard/ billing/       # Server pages wrapping typed client views (page.client.tsx)
  meters/  meters/[id]/     # Table page; detail page with lazy chart chunks (MeterCharts)
  streams/ offline/         # Live feeds; offline status + sync-queue management
  api/export/               # Rate-limited export route (EXPORT_MAX_RECORDS cap)
  sw.ts                     # Service worker source (compiled to public/sw.js by Serwist)
  sitemap.ts robots.ts      # Generated from the shared NAV_ITEMS registry
src/
  components/
    ui/                     # Design-system primitives — Button, Input/Field, Card, Badge,
                            #   DataTable, Modal, Tooltip, Tabs, Progress, EmptyState, …
    layout/ common/         # AppShell, PageHeader, CommandPalette, KeyboardShortcutsDialog,
                            #   ErrorBoundary, OfflineBanner, SyncQueuePanel
    meters/ billing/        # Domain components: RegisterMeterForm, SubmitReadingForm,
                            #   MeterSearchablePicker, InvoiceDetailModal
    charts/ export/         # Recharts wrappers; CSV/JSON/PDF generation + ExportDialog
    pwa/ theme/ dashboard/  # Install prompt, SW registration, ThemeProvider, alerts
  lib/
    api/                    # apiFetch<T> client + SWR hooks — the fixture→backend seam
    types/                  # Canonical domain types (Meter, Invoice, DataStream, …)
    validation/             # zod schemas (Stellar addresses, readings, exports, sanitization)
    storage/                # IndexedDB queue (db.ts) + reconnect drain (syncProcessor.ts)
    hooks/                  # useLocalStorage, useFocusTrap, useKeyboardShortcut, …
    utils/                  # Intl formatters, time-series bucketing, cn()
    security/               # Env validation, CSRF token pairs, sanitization
    seo/    fixtures/       # Metadata + JSON-LD builders; typed demo data
```

### Data flow

```
┌─────────────┐   SWR hooks    ┌──────────────────┐   fixture seam   ┌──────────┐
│ page.client │ ─────────────▶ │ src/lib/api      │ ── TODO(seam) ─▶ │ backend  │
└─────────────┘                └──────────────────┘                  └──────────┘
       │  mutations (offline-safe)        ▲
       ▼                                  │ drain on reconnect / interval
┌──────────────────┐   enqueue    ┌──────────────────┐
│ form components  │ ───────────▶ │ IndexedDB queue  │ ─▶ POST /api/*
└──────────────────┘              └──────────────────┘
```

- **Read path:** pages consume `useMeters()`, `useInvoices()`, `useStreams()`,
  `useDashboardSummary()` from `src/lib/api/hooks.ts`. Each hook resolves a
  typed fixture and marks the exact line (`TODO(seam)`) where an
  `apiFetch<T>` call to the real route slots in — **no component changes at
  integration time**.
- **Write path:** validated submissions enqueue to IndexedDB
  (`meter-reading`, `transaction`, `billing-update`), then drain
  oldest-first on reconnect, on queue-change, and on a 30s interval, with
  retry caps and a failure removal policy in `syncProcessor.ts`.

### Backend integration checklist

1. Implement the `/api/*` routes (the Next config already rewrites
   `/api/:path*` → `BACKEND_URL`).
2. Swap each fixture fetcher for `apiFetch<T>(path)` at the marked seams.
3. Point `submitOperation()` in `src/lib/storage/syncProcessor.ts` at the
   real mutation endpoints per operation type.
4. Set `CSRF_SECRET` (≥ 32 chars) so the middleware's token-pair flow signs
   correctly; clients fetch `GET /api/csrf-token` and send `x-csrf-token`.

## Security

Enforced in `src/middleware.ts` and `next.config.ts`:

- **CSP** — `default-src 'self'`, Stellar-only `connect-src`, no frames, no
  objects, `upgrade-insecure-requests`
- **Headers** — HSTS (1y, preload), `X-Frame-Options: DENY`,
  `nosniff`, strict referrer policy, Permissions-Policy (camera, mic,
  geolocation, FLoC and more disabled), `X-Powered-By` stripped
- **CSRF** — double-submit token pairs (HMAC-signed cookie + `x-csrf-token`
  header) required on all state-changing `/api/*` requests
- **Wallet allowlist** — `x-wallet-origin` accepted only from Freighter,
  Albedo, Rabet, Lobstr, xBull (localhost in development)
- **Input validation** — zod schemas for Stellar addresses/contract IDs,
  XSS-pattern sanitization for exported content, CSV formula-injection
  neutralization (`=`, `+`, `-`, `@` prefixed cells)

## Testing

### Unit (Vitest)

45 files / 348 tests cover hooks, formatters, bucketing, storage, export
generation, and every UI primitive. Configuration lives in `vitest.config.ts`
(jsdom, globals, `@` path alias).

```bash
npm test
```

Conventions: colocate as `*.test.ts(x)` beside the source; component tests
assert roles and accessible names (Testing Library), not implementation
details. The pre-commit hook runs `typecheck && lint` before every commit.
Icon assets are regenerated with `node scripts/generate-pwa-icons.mjs`.

### Integration (Playwright + Soroban)

An end-to-end harness runs against a local Soroban-capable Stellar node and
the deployed contracts (meter registry, stream manager, billing ledger),
including gas benchmarks per operation.

**1) Start the local Soroban RPC (Stellar Quickstart):**

```bash
docker compose -f docker-compose.test.yml up -d
```

The compose file runs `stellar/quickstart:testing` with `--local
--enable-stellar-rpc`, a healthcheck on `getHealth`, and maps port 8000 —
the RPC endpoint is then available at `http://localhost:8000/rpc`.

**2) Configure contract addresses** (optional — sensible testnet defaults):

```bash
CONTRACT_ID_METER_REGISTRY=C...
CONTRACT_ID_STREAM_MANAGER=C...
CONTRACT_ID_BILLING_LEDGER=C...
TEST_ACCOUNT_SECRET=S...
```

**3) Run:**

```bash
npm run test:integration
```

<details>
<summary>PowerShell</summary>

```powershell
$env:NEXT_PUBLIC_SOROBAN_RPC_URL="http://localhost:8000/rpc"
npm run test:integration
```

</details>

Tuning knobs (timeouts, gas-benchmark expectations) are documented inline in
`src/test/integration/testConfig.ts`.

## Engineering Conventions

- **One seam per swap.** Backend integration points are marked `TODO(seam)` —
  single-line changes, never component rewrites.
- **Format at the edge.** State holds raw numbers and ISO dates; presentation
  formatting happens at render time via `src/lib/utils/format.ts` (locale-aware,
  cache-backed). Never store display strings in state — string-formatted
  values broke sorting ("9,000" vs "10,000") before this rule.
- **Primitives over pages.** Reusable UI belongs in `src/components/ui` with
  tests; pages compose primitives and hold only wiring.
- **Accessibility is part of the contract.** Keyboard paths, ARIA wiring, and
  focus management ship with the primitive, not as a later pass (see
  `useFocusTrap`, the combobox pattern, `aria-sort` in DataTable).
- **Chart weight stays out of the critical path.** Recharts loads through
  `next/dynamic` client wrappers (`app/meters/[id]/MeterCharts.tsx`) — note
  that `ssr: false` dynamic imports must live in client components.
- **Hooks are tested and SSR-safe.** Shared hooks guard hydration
  (`useSyncExternalStore`-based where relevant), clean up their subscriptions,
  and carry unit tests.

## Related Repositories

- [EquipChain Contracts](https://github.com/EquipChain/EquipChain-contracts) — Soroban smart contracts (meter registry, stream manager, billing ledger)
- [EquipChain Backend](https://github.com/EquipChain/EquipChain-backend) — API service consumed via `/api/*` proxy

## Project History

See [CHANGELOG.md](./CHANGELOG.md) for the full record, including the
100-item frontend improvement program (typed data layer, design system,
offline/PWA hardening, accessibility, export pipeline, and documentation).
