# Equipchain Frontend Dashboard

A Next.js frontend dashboard for visualizing utility metering and billing data from Equipchain smart contracts on Stellar Soroban.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Features

- Real-time utility meter monitoring with reading-history and usage charts
- Usage and billing visualization with per-invoice detail and export
- Gas buffer status tracking with actionable alerts
- Offline-capable operation queue with sync-on-reconnect
- Installable PWA with keyboard-first navigation (Ctrl/Cmd+K, press `?`)

See [CHANGELOG.md](./CHANGELOG.md) for the full improvement history.

## Architecture

```
app/                    # Next.js App Router pages (server components + client islands)
  dashboard/            # Overview: stat cards, consumption chart, alerts
  meters/[id]/          # Detail page with lazy-loaded chart chunks
  billing/  streams/    # Typed tables over the SWR layer
  offline/              # Offline status + sync queue management
src/
  components/
    ui/                 # Design-system primitives (Button, DataTable, Modal, …)
    layout/  common/    # AppShell, PageHeader, CommandPalette, ErrorBoundary
    meters/ billing/    # Domain components (forms, pickers, invoice modal)
    charts/ export/     # Recharts wrappers, CSV/JSON/PDF export
    pwa/    theme/      # Service worker registration, install prompt, theming
  lib/
    api/                # Typed fetch client + SWR hooks (fixture-backed seam)
    types/              # Canonical domain types
    validation/         # zod schemas
    storage/            # IndexedDB queue + sync processor
    hooks/  utils/      # Reusable hooks; formatters, bucketing, cn()
    seo/    fixtures/   # Metadata/JSON-LD helpers; demo data
```

### Data flow

Pages consume SWR hooks from `src/lib/api/hooks.ts`, which resolve typed
fixtures today. Each hook marks the single seam where the real EquipChain
backend route slots in — no component changes needed at integration time.
Offline submissions (meter readings, registrations) enqueue to IndexedDB
and drain automatically on reconnect via `src/lib/storage/syncProcessor.ts`.

### Conventions

- **One seam per swap:** backend integration points are marked `TODO(seam)`
- **Format at the edge:** keep raw numbers/ISO dates in state; format via
  `src/lib/utils/format.ts` at render time
- **Primitives over pages:** UI chrome belongs in `src/components/ui` with
  tests; pages compose
- **Every hook/tested:** shared hooks and utilities carry unit tests
  (`npx vitest run`)

## Development

```bash
npm run dev         # dev server (--webpack)
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest (unit)
npm run validate    # typecheck + lint + build
npm run analyze     # bundle analysis
```

Pre-commit hooks run typecheck and lint; keep commits atomic and messages
explanatory (what + why).

## Integration Testing (Playwright + Soroban)

This repository includes an end-to-end integration test harness built on Playwright, designed to run against a local Soroban-capable Stellar node (Quickstart).

### 1) Start local Soroban RPC (Quickstart)

```bash
docker compose -f docker-compose.test.yml up -d
```

The Soroban/Stellar RPC endpoint will be available at `http://localhost:8000/rpc`.

### 2) Run integration tests

```bash
npm run test:integration
```

PowerShell:

```powershell
$env:NEXT_PUBLIC_SOROBAN_RPC_URL="http://localhost:8000/rpc"
npm run test:integration
```

## Learn More

- [Equipchain Contracts](https://github.com/EquipChain/EquipChain-contracts)
- [Equipchain Backend API](https://github.com/EquipChain/EquipChain-backend)
