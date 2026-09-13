import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ExportDialog } from "./ExportDialog";
import { ToastProvider } from "@/src/components/ui/toast";

// ============================================================================
// ExportDialog — clipboard delivery mode
// ============================================================================
// The dialog can deliver exports either as a file download or by copying the
// identical payload to the clipboard. These tests pin the clipboard path:
// payload correctness, toast feedback, the PDF guard, permission-denial
// handling, and the reset-to-download behavior when the dialog reopens.

const COLUMNS = [
  { key: "name", label: "Name", enabled: true },
  { key: "reading", label: "Reading", enabled: true },
];

const DATA = [
  { name: "Main", reading: 12 },
  { name: "Annex", reading: 5 },
];

function stubClipboard() {
  if (!navigator.clipboard) {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    });
  }
  return vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
}

/** Controlled harness so tests can close and reopen the dialog. */
function Harness() {
  const [open, setOpen] = useState(true);
  return (
    <ToastProvider>
      <button type="button" onClick={() => setOpen((o) => !o)}>
        toggle
      </button>
      <ExportDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        columns={COLUMNS}
        data={DATA}
        title="Meters"
        dataType="meters"
      />
    </ToastProvider>
  );
}

async function chooseDelivery(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole("radio", { name: label }));
}

beforeEach(() => {
  render(<Harness />);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ExportDialog clipboard delivery", () => {
  it("copies the CSV payload to the clipboard and closes the dialog", async ({
    task,
  }) => {
    const user = userEvent.setup();
    const writeText = stubClipboard();

    await chooseDelivery(user, "Copy to clipboard");
    await user.click(screen.getByRole("button", { name: /Copy 2 Columns/ }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });
    // Clipboard payload mirrors the file download (BOM omitted for paste).
    expect(writeText).toHaveBeenCalledWith("Name,Reading\r\nMain,12\r\nAnnex,5");

    // Success feedback and dialog dismissal.
    expect(await screen.findByText("Copied to clipboard")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Export Meters" })
      ).not.toBeInTheDocument();
    });
    expect(task).toBeDefined();
  });

  it("rejects clipboard delivery for PDF exports with a visible error", async () => {
    const user = userEvent.setup();
    const writeText = stubClipboard();

    await user.click(screen.getByRole("radio", { name: /PDF \(\.pdf\)/ }));
    await chooseDelivery(user, "Copy to clipboard");
    await user.click(screen.getByRole("button", { name: /Copy 2 Columns/ }));

    // Scope to the dialog: the failed export also raises an error toast.
    const dialog = screen.getByRole("dialog", { name: "Export Meters" });
    const alert = await waitFor(() => {
      const el = within(dialog).getByRole("alert");
      expect(el).toHaveTextContent(
        "Clipboard export is not available for PDF. Choose CSV or JSON."
      );
      return el;
    });
    expect(alert).toBeDefined();
    expect(writeText).not.toHaveBeenCalled();
    // Dialog stays open so the user can switch formats.
    expect(screen.getByRole("dialog", { name: "Export Meters" })).toBeInTheDocument();
  });

  it("surfaces an error when the clipboard write is denied", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(
      new DOMException("Permission denied", "NotAllowedError")
    );

    await chooseDelivery(user, "Copy to clipboard");
    await user.click(screen.getByRole("button", { name: /Copy 2 Columns/ }));

    // Scope to the dialog: the failure also raises an error toast.
    const dialog = screen.getByRole("dialog", { name: "Export Meters" });
    await waitFor(() => {
      expect(within(dialog).getByRole("alert")).toHaveTextContent(
        "Could not access the clipboard — permission was denied."
      );
    });
    // The dialog stays open so the user can retry or download instead.
    expect(screen.getByRole("dialog", { name: "Export Meters" })).toBeInTheDocument();
  });

  it("resets to file download whenever the dialog reopens", async () => {
    const user = userEvent.setup();
    stubClipboard();

    // Select clipboard, then close without exporting.
    await chooseDelivery(user, "Copy to clipboard");
    await user.click(screen.getByRole("button", { name: "Close dialog" }));

    // Reopen: delivery must be back on "Save file", not the stale choice.
    await user.click(screen.getByRole("button", { name: "toggle" }));
    const download = screen.getByRole("radio", { name: "Save file" });
    expect(download).toHaveAttribute("aria-checked", "true");
  });
});
