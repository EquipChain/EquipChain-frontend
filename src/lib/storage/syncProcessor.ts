"use client";

import { getPendingOperations, markOperationStatus, removeOperation } from "./db";
import type { QueuedOperation } from "./db";

// ============================================================================
// SyncProcessor — replays the offline queue when connectivity returns
// ============================================================================
// Operations queue to IndexedDB when offline, but nothing ever drained
// the queue: entries sat forever, the OfflineBanner claimed "syncing
// data..." falsely, and users could double-submit. This module drains the
// queue on the equipchain:online event and on an interval while online.
// The actual submission endpoint is a marked seam per operation type.

const SYNC_INTERVAL_MS = 30_000;
const MAX_RETRIES = 5;

/** Submits one queued operation. TODO(seam): real endpoint per type. */
async function submitOperation(op: QueuedOperation): Promise<void> {
  const payload = op.payload as Record<string, unknown>;
  switch (op.type) {
    case "meter-reading":
      // Reading submissions and registrations both target the meters API.
      await fetch("/api/meters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((res) => {
        if (!res.ok) throw new Error(`Submission failed: ${res.status}`);
      });
      break;
    case "transaction":
    case "billing-update":
      // No server route exists yet for these types; fail them explicitly
      // so they surface in retry counts instead of looping forever.
      throw new Error(`No submission endpoint for ${op.type}`);
    default: {
      const exhaustive: never = op.type;
      throw new Error(`Unknown operation type: ${String(exhaustive)}`);
    }
  }
}

let syncing = false;

/**
 * Drains pending operations oldest-first. Safe to call concurrently:
 * re-entrant calls while a sync is running are no-ops.
 *
 * @returns number of operations successfully synced
 */
export async function processSyncQueue(): Promise<number> {
  if (syncing) return 0;
  syncing = true;
  let synced = 0;
  try {
    const pending = await getPendingOperations();
    for (const op of pending) {
      try {
        await submitOperation(op);
        await removeOperation(op.id);
        synced += 1;
      } catch {
        // Increment retry count; drop entries that exhausted their retries
        // so a permanently-failing payload cannot clog the queue forever.
        await markOperationStatus(op.id, "failed");
        const op2 = pending.find((p) => p.id === op.id);
        if (op2 && op2.retries + 1 >= MAX_RETRIES) {
          await removeOperation(op.id);
        }
      }
    }
  } finally {
    syncing = false;
    if (synced > 0) {
      window.dispatchEvent(new Event("equipchain:queue-changed"));
    }
  }
  return synced;
}

/**
 * Hooks the queue drain to connectivity events. Returns a cleanup
 * function; call once from a client component mounted in the root layout.
 */
export function startSyncProcessor(): () => void {
  const onOnline = () => void processSyncQueue();
  const onQueueChanged = () => {
    // New operation enqueued while online: drain immediately instead of
    // waiting for the next interval tick.
    if (navigator.onLine) void processSyncQueue();
  };

  window.addEventListener("equipchain:online", onOnline);
  window.addEventListener("equipchain:queue-changed", onQueueChanged);
  const interval = setInterval(() => {
    if (navigator.onLine) void processSyncQueue();
  }, SYNC_INTERVAL_MS);

  // Drain anything pending at startup (e.g. browser closed while offline).
  if (navigator.onLine) void processSyncQueue();

  return () => {
    window.removeEventListener("equipchain:online", onOnline);
    window.removeEventListener("equipchain:queue-changed", onQueueChanged);
    clearInterval(interval);
  };
}
