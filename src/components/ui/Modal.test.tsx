import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test">
        Body
      </Modal>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog with accessible title and body", () => {
    render(
      <Modal isOpen onClose={() => {}} title="Export data" description="3 records">
        <p>Pick columns</p>
      </Modal>
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "Export data");
    expect(screen.getByText("Pick columns")).toBeInTheDocument();
    expect(screen.getByText("3 records")).toBeInTheDocument();
  });

  it("closes on Escape key", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="T">
        Body
      </Modal>
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on overlay click but not on content click", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="T">
        <button type="button">Inside</button>
      </Modal>
    );
    // Overlay is the dialog's parent; click it directly
    await userEvent.click(document.querySelector(".fixed.inset-0")!);
    expect(onClose).toHaveBeenCalledOnce();

    onClose.mockClear();
    await userEvent.click(screen.getByRole("button", { name: "Inside" }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes via the close button", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="T">
        Body
      </Modal>
    );
    await userEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("locks body scroll while open and restores on close", () => {
    const { unmount } = render(
      <Modal isOpen onClose={() => {}} title="T">
        Body
      </Modal>
    );
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("traps Tab focus inside the dialog", async () => {
    render(
      <Modal
        isOpen
        onClose={() => {}}
        title="T"
        footer={<button type="button">Cancel</button>}
      >
        <button type="button">First</button>
        <button type="button">Second</button>
      </Modal>
    );
    const dialog = screen.getByRole("dialog");
    const first = screen.getByRole("button", { name: "First" });
    const cancel = screen.getByRole("button", { name: "Cancel" });

    cancel.focus();
    await userEvent.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);

    // Shift+Tab from the first element stays inside the dialog (wraps)
    first.focus();
    await userEvent.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(document.body);
  });

  it("renders footer actions", () => {
    render(
      <Modal
        isOpen
        onClose={() => {}}
        title="T"
        footer={<button type="button">Export now</button>}
      >
        Body
      </Modal>
    );
    expect(
      screen.getByRole("button", { name: "Export now" })
    ).toBeInTheDocument();
  });
});
