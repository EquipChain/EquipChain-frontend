import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// jsdom renders outside the Next app router, so every test mocks useRouter.
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { KeyboardShortcutsDialog, GO_TO_KEYS } from "./KeyboardShortcutsDialog";

// jsdom lacks scrollIntoView (rendered by Modal internals in some paths).
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = function () {};
});

afterEach(() => {
  vi.useRealTimers();
});

describe("KeyboardShortcutsDialog", () => {
  it("does not render the dialog initially", () => {
    render(<KeyboardShortcutsDialog />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the discoverability button", () => {
    render(<KeyboardShortcutsDialog />);
    expect(
      screen.getByRole("button", { name: "Keyboard shortcuts" })
    ).toBeInTheDocument();
  });

  it("opens on ? and lists the advertised shortcuts", async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsDialog />);

    await user.keyboard("?");
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Keyboard shortcuts");
    expect(dialog).toHaveTextContent("Open the command palette");
    expect(dialog).toHaveTextContent("Go to Dashboard");
  });

  it("opens via the discoverability button", async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsDialog />);
    await user.click(screen.getByRole("button", { name: "Keyboard shortcuts" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsDialog />);
    await user.keyboard("?");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("navigates on g then d/m/b/s sequences", async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsDialog />);

    await user.keyboard("gd");
    expect(push).toHaveBeenCalledWith("/dashboard");

    push.mockClear();
    await user.keyboard("gs");
    expect(push).toHaveBeenCalledWith("/streams");
  });

  it("does not open when typing in an input", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <input aria-label="search field" />
        <KeyboardShortcutsDialog />
      </div>
    );

    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.keyboard("?");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(input).toHaveValue("?");
  });

  it("exposes the g-key route map matching the advertised sections", () => {
    expect(GO_TO_KEYS).toEqual({
      d: "/dashboard",
      m: "/meters",
      b: "/billing",
      s: "/streams",
    });
  });
});
