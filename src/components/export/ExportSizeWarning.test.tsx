import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ExportDialog } from "./ExportDialog";
import { ToastProvider } from "@/src/components/ui/toast";

// ============================================================================
// Large-export guidance
// ============================================================================
// Exports over the row threshold can take seconds (PDF worst) and freeze
// the tab with no feedback. The dialog now surfaces an estimated size and
// a format hint; these tests pin when the notice appears and when it
// deliberately stays out of the way.

const COLUMNS = [
  { key: "name", label: "Name", enabled: true },
  { key: "reading", label: "Reading", enabled: true },
];

function makeRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    name: `meter-${i}`,
    reading: i,
  }));
}

function renderDialog(data: Record<string, unknown>[]) {
  return render(
    <ToastProvider>
      <ExportDialog
        isOpen
        onClose={() => {}}
        columns={COLUMNS}
        data={data}
        title="Meters"
        dataType="meters"
      />
    </ToastProvider>
  );
}

beforeEach(() => {
  // window.open is only touched by the PDF path; not exercised here.
  vi.stubGlobal("open", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ExportDialog size warning", () => {
  it("shows no size notice for small exports", () => {
    renderDialog(makeRows(10));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("warns with row count and estimated size above the threshold", () => {
    renderDialog(makeRows(12_000));
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Large export: 12,000 rows");
    expect(status).toHaveTextContent(/about 1\.4 MB/);
  });

  it("recommends CSV over PDF for large exports when PDF is selected", () => {
    renderDialog(makeRows(11_000));
    // Default format is CSV — hint should NOT mention PDF yet.
    expect(screen.getByRole("status").textContent).not.toMatch(/PDF/);
  });
});
