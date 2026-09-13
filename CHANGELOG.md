# Changelog

All notable changes to the EquipChain frontend are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added — Frontend improvement program (100 items)

A dedicated program of 100 targeted fixes, features, and improvements,
shipped as individual reviewed commits. Highlights by area:

**Foundations (data, types, tooling)**

- Canonical domain types (`Meter`, `Invoice`, `DataStream`, …) replacing
  mutually-incompatible anonymous row shapes per page
- Typed SWR data layer with fixture-backed fetchers, loading/error states,
  and a single seam for the future backend
- Centralized `Intl`-based formatters for numbers, currency, dates, and
  units; locale-aware date helpers (`formatDateLocale`, …)
- Pure time-series bucketing helpers for usage charts
- SSR-safe hooks: `useLocalStorage`, `useMediaQuery`, `useOnlineStatus`,
  `useCopyToClipboard`, `useDebouncedValue`, `usePrevious`,
  `useIdleDetection`, `useFocusTrap`, `useKeyboardShortcut`,
  `useFormValidation`, `usePwaInstall`

**Design system**

- Core primitives: Button, Input/TextArea/Label/Field, Card, Badge (with
  status dot), StatusBadge, Tabs, Progress, Tooltip (with hover delay),
  Modal (shared focus trap), DropdownMenu, Skeleton, Spinner, Kbd,
  SegmentedControl, Breadcrumbs, StatCard, Sparkline, EmptyState (with
  illustration variant), ConfirmationDialog
- `DataTable`: sortable, searchable, paginated, accessible, with mobile
  card layout, density presets, and a real empty state
- `cn()` class-merge utility and a documented token layer for light/dark

**Application shell & navigation**

- `AppShell` with persistent nav, active-section highlighting, mobile
  drawer, and skip-link focus handling
- Ctrl/Cmd+K command palette; press-`?` keyboard shortcut reference with
  vim-style `g d/m/b/s` section jumps
- NAV_ITEMS registry shared by shell, 404, sitemap, and palette

**Pages**

- Dashboard rebuilt on typed data with gas-buffer health, per-utility
  breakdown, consumption chart (lazy-loaded recharts), and actionable
  alerts for overdue invoices and a critical gas reserve
- Meters table with real formatting/sorting, register + submit-reading
  forms (offline-safe queueing), searchable meter picker combobox, and a
  full detail page with reading-history and usage-by-period charts plus
  in-context actions
- Billing rebuilt on typed data with aggregates, per-invoice detail
  modal, and printable invoice view
- Streams table with liveness indicators, self-refreshing relative
  timestamps, and status filters

**Offline & PWA**

- IndexedDB operation queue with visibility panel, Sync-now action, and
  automatic drain on reconnect; install prompt; generated icons and
  manifest; registered service worker with a valid precache manifest

**Export & printing**

- CSV/JSON/PDF export with column selection, date-range filtering,
  CSV formula-injection neutralization, clipboard delivery mode, size
  warnings for large exports, and a print stylesheet that produces a
  clean document (light ink, chrome stripped, rows kept intact)

**Reliability & a11y**

- Route-level and widget-level error boundaries with recovery actions
- Loading skeletons per route; working Retry on fetch errors
- SEO: per-page metadata, JSON-LD `@graph`, sitemap from the nav registry
- Keyboard/ARIA coverage across tables, dialogs, comboboxes, and palettes;
  reduced-motion support; no flash of wrong theme

### Changed

- All pages consume the shared typed data layer instead of inline literal
  rows, fixing string-comparison sorting bugs ("9,000" vs "10,000")
- Service worker build artifact no longer committed stale

## [0.1.0] — Initial scaffold

- Next.js app scaffold for the utility metering dashboard
- End-to-end integration harness (Playwright + local Soroban Quickstart)
- Security headers, CSP, input validation, and env validation
- Comprehensive SEO metadata, structured data, and sitemap
- Design tokens, dark theme, and brand assets

[Unreleased]: https://github.com/EquipChain/EquipChain-frontend/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/EquipChain/EquipChain-frontend/releases/tag/v0.1.0
