import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { useFocusTrap } from "./useFocusTrap";

// ---------------------------------------------------------------------------
// useFocusTrap
// ---------------------------------------------------------------------------

function TrapHarness({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, active);
  return (
    <div>
      <div ref={containerRef}>
        <button type="button">First</button>
        <button type="button">Middle</button>
        <button type="button">Last</button>
      </div>
      <button type="button">Outside</button>
    </div>
  );
}

describe("useFocusTrap", () => {
  it("does nothing while inactive — Tab moves out of the container", async () => {
    const user = userEvent.setup();
    render(<TrapHarness active={false} />);
    const last = screen.getByRole("button", { name: "Last" });
    last.focus();

    await user.tab();
    expect(
      screen.getByRole("button", { name: "Outside" }).contains(document.activeElement)
    ).toBe(true);
  });

  it("wraps forward from the last element back to the first while active", async () => {
    const user = userEvent.setup();
    render(<TrapHarness active={true} />);
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });
    last.focus();

    await user.tab();
    expect(document.activeElement).toBe(first);
  });

  it("wraps backwards from the first element to the last while active", async () => {
    const user = userEvent.setup();
    render(<TrapHarness active={true} />);
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });
    first.focus();

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);
  });

  it("lets Tab move normally between elements inside the container", async () => {
    const user = userEvent.setup();
    render(<TrapHarness active={true} />);
    const first = screen.getByRole("button", { name: "First" });
    const middle = screen.getByRole("button", { name: "Middle" });
    first.focus();

    await user.tab();
    expect(document.activeElement).toBe(middle);
  });

  it("pulls focus back into the container when focus lands outside it", async () => {
    const user = userEvent.setup();
    render(<TrapHarness active={true} />);
    const outside = screen.getByRole("button", { name: "Outside" });
    outside.focus();

    await user.tab();
    // The stray Tab is consumed and focus re-anchors to the first element.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "First" }));
  });

  it("reacts to the active flag flipping at runtime", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TrapHarness active={false} />);

    rerender(<TrapHarness active={true} />);
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });
    last.focus();

    await user.tab();
    expect(document.activeElement).toBe(first);
  });
});

// ---------------------------------------------------------------------------
// Integration: Modal uses the hook and still traps focus end-to-end
// ---------------------------------------------------------------------------

describe("Modal focus trap integration", () => {
  it("keeps Shift+Tab from the first focusable inside the dialog", async () => {
    const { Modal } = await import("@/src/components/ui/Modal");
    const user = userEvent.setup();
    render(
      <Modal isOpen onClose={() => {}} title="T" footer={<button type="button">Cancel</button>}>
        <button type="button">First</button>
      </Modal>
    );
    const dialog = screen.getByRole("dialog");
    const first = screen.getByRole("button", { name: "First" });

    first.focus();
    await user.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});
