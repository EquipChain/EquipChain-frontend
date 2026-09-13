"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Trash2, RefreshCw, CloudUpload } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import {
  ConfirmationDialog,
} from "@/src/components/ui/ConfirmationDialog";
import { useToast } from "@/src/components/ui/toast";
import { getPendingOperations, removeOperation } from "@/src/lib/storage/db";
import { processSyncQueue } from "@/src/lib/storage/syncProcessor";
import type { QueuedOperation } from "@/src/lib/storage/db";
import { formatRelativeTime } from "@/src/lib/utils/format";

// ============================================================================
// SyncQueuePanel — visibility and control over the offline operation queue
// ============================================================================
// Operations queue to IndexedDB when offline (meter registrations,
// readings), but the only trace was a count in the OfflineBanner. Users
// had no way to see WHAT was pending, force a sync attempt, or remove
// stale entries. This panel lists the queue and offers retry-now, per-item
// and bulk removal.

const OPERATION_LABELS: Record<QueuedOperation["type"], string> = {
  "meter-reading": "Meter operation",
  transaction: "Transaction",
  "billing-update": "Billing update",
};

export function SyncQueuePanel() {
  const [operations, setOperations] = useState<QueuedOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    try {
      const ops = await getPendingOperations();
      setOperations(ops);
    } catch {
      // IndexedDB unavailable (private browsing) — panel just stays empty.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener("equipchain:queue-changed", onChange);
    const interval = setInterval(() => void refresh(), 10_000);
    return () => {
      window.removeEventListener("equipchain:queue-changed", onChange);
      clearInterval(interval);
    };
  }, [refresh]);

  const retryNow = async () => {
    if (!navigator.onLine) {
      toast({
        title: "Still offline",
        description: "Operations will sync automatically when you reconnect.",
        variant: "warning",
      });
      return;
    }
    setSyncing(true);
    try {
      const synced = await processSyncQueue();
      if (synced > 0) {
        toast({
          title: `Synced ${synced} operation${synced === 1 ? "" : "s"}`,
          variant: "success",
        });
      } else {
        toast({
          title: "Nothing synced yet",
          description: "Operations failed or are still pending — see retry counts.",
          variant: "info",
        });
      }
    } finally {
      setSyncing(false);
      await refresh();
    }
  };

  const removeItem = async (id: string) => {
    await removeOperation(id);
    await refresh();
    window.dispatchEvent(new Event("equipchain:queue-changed"));
    toast({ title: "Queued operation removed", variant: "success" });
  };

  const clearAll = async () => {
    for (const op of operations) {
      await removeOperation(op.id);
    }
    await refresh();
    window.dispatchEvent(new Event("equipchain:queue-changed"));
    setConfirmingClear(false);
    toast({
      title: "Queue cleared",
      description: `${operations.length} pending operation${operations.length === 1 ? "" : "s"} removed.`,
      variant: "success",
    });
  };

  return (
    <div
      className="rounded-xl border border-border bg-surface"
      aria-busy={loading || undefined}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Clock className="h-4 w-4 text-text-muted" aria-hidden="true" />
          Offline queue
          {operations.length > 0 && (
            <Badge variant="warning">{operations.length} pending</Badge>
          )}
        </h2>
        <div className="flex items-center gap-1">
          {operations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void retryNow()}
              disabled={syncing}
              aria-label="Sync queued operations now"
            >
              <CloudUpload className="h-3.5 w-3.5" aria-hidden="true" />
              Sync now
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refresh()}
            aria-label="Refresh queue"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          {operations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingClear(true)}
              className="text-error hover:text-error"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {operations.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-text-muted">
          {loading
            ? "Checking for pending operations…"
            : "Nothing queued. Operations you submit offline will appear here."}
        </p>
      ) : (
        <ul className="divide-y divide-border-light">
          {operations.map((op) => (
            <li key={op.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {OPERATION_LABELS[op.type] ?? op.type}
                </p>
                <p className="truncate text-xs text-text-muted">
                  {formatRelativeTime(op.timestamp)} ·{" "}
                  {op.retries} {op.retries === 1 ? "retry" : "retries"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void removeItem(op.id)}
                aria-label={`Remove queued ${op.type} from ${formatRelativeTime(op.timestamp)}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmationDialog
        isOpen={confirmingClear}
        onClose={() => setConfirmingClear(false)}
        onConfirm={() => void clearAll()}
        title="Clear the offline queue?"
        message={`This permanently discards ${operations.length} pending operation${operations.length === 1 ? "" : "s"} that have not synced. This cannot be undone.`}
        confirmLabel="Discard operations"
      />
    </div>
  );
}
