import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmationDialog } from "./ConfirmationDialog";

describe("ConfirmationDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <ConfirmationDialog
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Discard changes"
        message="This cannot be undone."
      />
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("renders title, message, and both buttons when open", () => {
    render(
      <ConfirmationDialog
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Discard changes"
        message="This cannot be undone."
      />
    );
    expect(screen.getByRole("alertdialog", { name: "Discard changes" })).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("calls onConfirm when confirmed (closing is the caller's job)", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmationDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete"
        message="Are you sure?"
        confirmLabel="Delete stream"
      />
    );
    await user.click(screen.getByRole("button", { name: "Delete stream" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    // The dialog stays open so callers can await async work before closing.
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls only onClose when cancelled", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmationDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete"
        message="Are you sure?"
      />
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("supports custom labels and a confirming state", () => {
    render(
      <ConfirmationDialog
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete"
        message="Are you sure?"
        confirmLabel="Yes, delete"
        cancelLabel="Keep it"
        confirming
      />
    );
    // aria-busy + disabled while the action runs; label stays stable so the
    // button doesn't swap text mid-interaction.
    const confirm = screen.getByRole("button", { name: "Yes, delete" });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Keep it" })).toBeDisabled();
  });
});
