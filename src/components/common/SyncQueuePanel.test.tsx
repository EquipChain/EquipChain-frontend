import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/src/lib/storage/db", () => ({
  getPendingOperations: vi.fn().mockResolvedValue([]),
  removeOperation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/src/lib/storage/syncProcessor", () => ({
  processSyncQueue: vi.fn().mockResolvedValue(0),
}));

import { SyncQueuePanel } from "./SyncQueuePanel";
import { getPendingOperations } from "@/src/lib/storage/db";
import { processSyncQueue } from "@/src/lib/storage/syncProcessor";
import { ToastProvider } from "@/src/components/ui/toast";

function renderPanel() {
  return render(
    <ToastProvider>
      <SyncQueuePanel />
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.mocked(getPendingOperations).mockResolvedValue([]);
  vi.mocked(processSyncQueue).mockResolvedValue(0);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SyncQueuePanel", () => {
  it("shows the empty state and no actions when nothing is queued", async () => {
    renderPanel();
    expect(
      await screen.findByText(/Nothing queued/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sync queued operations now/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Clear all/i })).not.toBeInTheDocument();
  });

  it("lists queued operations with retry counts", async () => {
    vi.mocked(getPendingOperations).mockResolvedValue([
      {
        id: "op-1",
        type: "meter-reading",
        payload: {},
        timestamp: Date.now() - 60_000,
        status: "pending",
        retries: 2,
      },
    ]);

    renderPanel();
    expect(await screen.findByText("Meter operation")).toBeInTheDocument();
    const meta = screen.getByText(/retr/).closest("p");
    expect(meta?.textContent).toContain("2 retries");
    expect(screen.getByText("1 pending")).toBeInTheDocument();
  });

  it("invokes the sync processor from the Sync now button", async () => {
    const user = userEvent.setup();
    vi.mocked(getPendingOperations).mockResolvedValue([
      {
        id: "op-1",
        type: "meter-reading",
        payload: {},
        timestamp: Date.now(),
        status: "pending",
        retries: 0,
      },
    ]);
    vi.mocked(processSyncQueue).mockResolvedValue(1);

    renderPanel();
    await screen.findByText("Meter operation");

    await user.click(screen.getByRole("button", { name: /Sync queued operations now/i }));
    await waitFor(() => {
      expect(processSyncQueue).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText("Synced 1 operation")).toBeInTheDocument();
  });

  it("refuses to sync while offline with a warning", async () => {
    const user = userEvent.setup();
    vi.mocked(getPendingOperations).mockResolvedValue([
      {
        id: "op-1",
        type: "transaction",
        payload: {},
        timestamp: Date.now(),
        status: "pending",
        retries: 0,
      },
    ]);

    const onlineSpy = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    renderPanel();
    await screen.findByText("Transaction");

    await user.click(screen.getByRole("button", { name: /Sync queued operations now/i }));
    expect(await screen.findByText("Still offline")).toBeInTheDocument();
    expect(processSyncQueue).not.toHaveBeenCalled();

    onlineSpy.mockRestore();
  });

  it("reports when a sync attempt syncs nothing", async () => {
    const user = userEvent.setup();
    vi.mocked(getPendingOperations).mockResolvedValue([
      {
        id: "op-1",
        type: "billing-update",
        payload: {},
        timestamp: Date.now(),
        status: "pending",
        retries: 3,
      },
    ]);
    vi.mocked(processSyncQueue).mockResolvedValue(0);

    renderPanel();
    await screen.findByText("Billing update");

    await user.click(screen.getByRole("button", { name: /Sync queued operations now/i }));
    expect(await screen.findByText("Nothing synced yet")).toBeInTheDocument();
  });
});
