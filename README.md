# Equipchain Frontend Dashboard

A Next.js frontend dashboard for visualizing utility metering and billing data from Equipchain smart contracts on Stellar Soroban.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Features

- Real-time utility meter monitoring
- Usage and billing visualization
- Gas buffer status tracking
- Provider and consumer dashboards

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
