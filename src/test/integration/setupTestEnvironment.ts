/**
 * Test environment helpers.
 *
 * Provides:
 *  - Soroban RPC health check
 *  - Contract state snapshot utilities
 *  - Test-run cleanup hooks
 *
 * NOTE: Actual contract deployment is handled by the Stellar Quickstart
 * container defined in docker-compose.test.yml.  `deployTestContracts()` is a
 * placeholder that would invoke `stellar contract deploy` via the Stellar CLI;
 * in CI it is wired up through the integration.yml workflow.
 */

import { getIntegrationTestConfig } from "./testConfig";

// ─── Soroban RPC health ─────────────────────────────────────────────────────

/**
 * Returns `true` when the configured Soroban RPC endpoint responds with
 * `status: "healthy"`.
 */
export async function isSorobanRpcHealthy(): Promise<boolean> {
  const { sorobanRpcUrl } = getIntegrationTestConfig();
  if (!sorobanRpcUrl) return false;

  try {
    const response = await fetch(sorobanRpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
    });
    if (!response.ok) return false;
    const body = (await response.json()) as { result?: { status?: string } };
    return body.result?.status === "healthy";
  } catch {
    return false;
  }
}

// ─── Contract state snapshots ───────────────────────────────────────────────

export type ContractSnapshot = {
  /** The contract ID this snapshot was taken from */
  contractId: string;
  /** ISO timestamp of when the snapshot was captured */
  capturedAt: string;
  /** Arbitrary key→value ledger entries at the time of capture */
  entries: Record<string, unknown>;
};

/**
 * Capture a lightweight snapshot of the contract's ledger entries by calling
 * `getLedgerEntries` via JSON-RPC.  Returns an empty snapshot when the RPC is
 * unavailable or the contract ID is not set.
 */
export async function captureContractSnapshot(
  contractId: string | undefined
): Promise<ContractSnapshot> {
  const { sorobanRpcUrl } = getIntegrationTestConfig();
  const snapshot: ContractSnapshot = {
    contractId: contractId ?? "unknown",
    capturedAt: new Date().toISOString(),
    entries: {},
  };

  if (!contractId || !sorobanRpcUrl) return snapshot;

  try {
    const response = await fetch(sorobanRpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getLedgerEntries",
        params: { keys: [] },
      }),
    });
    if (!response.ok) return snapshot;
    const body = (await response.json()) as {
      result?: { entries?: { key: string; xdr: string }[] };
    };
    for (const entry of body.result?.entries ?? []) {
      snapshot.entries[entry.key] = entry.xdr;
    }
  } catch {
    // Non-fatal – snapshot remains empty
  }

  return snapshot;
}

/**
 * Compare two contract snapshots.  Returns `true` when at least one ledger key
 * differs between them, indicating on-chain state changed.
 */
export function snapshotsAreDifferent(
  before: ContractSnapshot,
  after: ContractSnapshot
): boolean {
  const beforeKeys = Object.keys(before.entries).sort();
  const afterKeys = Object.keys(after.entries).sort();
  if (beforeKeys.length !== afterKeys.length) return true;
  return beforeKeys.some(
    (key) =>
      before.entries[key] !== (after.entries as Record<string, unknown>)[key]
  );
}

// ─── Contract deployment (CI placeholder) ───────────────────────────────────

/**
 * Placeholder for contract deployment automation.
 *
 * In a full CI pipeline this function would:
 *  1. Invoke `stellar contract deploy` for each contract WASM
 *  2. Fund the deployer account via Friendbot
 *  3. Return the deployed contract IDs
 *
 * For now it reads pre-set CONTRACT_ID_* env vars injected by the workflow.
 */
export async function deployTestContracts(): Promise<{
  meterRegistry?: string;
  streamManager?: string;
  billingLedger?: string;
}> {
  const { contractIds } = getIntegrationTestConfig();
  return contractIds;
}

// ─── Test data cleanup ──────────────────────────────────────────────────────

/**
 * Minimal cleanup registry.  Tests register cleanup callbacks here and
 * `runTestCleanup()` executes them all in reverse insertion order.
 */
const cleanupCallbacks: Array<() => Promise<void> | void> = [];

/** Register a cleanup callback to be executed after the test suite. */
export function registerCleanup(fn: () => Promise<void> | void): void {
  cleanupCallbacks.push(fn);
}

/** Run all registered cleanup callbacks in reverse order (LIFO). */
export async function runTestCleanup(): Promise<void> {
  const callbacks = [...cleanupCallbacks].reverse();
  for (const cb of callbacks) {
    try {
      await cb();
    } catch (err) {
      // Cleanup errors are non-fatal; log and continue.
      console.warn("[test-cleanup] callback threw:", err);
    }
  }
  cleanupCallbacks.length = 0;
}
