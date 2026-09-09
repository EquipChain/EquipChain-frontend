import { describe, expect, it, vi } from "vitest";
import { render, screen, act, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "./toast";

function Harness({ onClick }: { onClick: (t: ReturnType<typeof useToast>["toast"]) => void }) {
  const { toast } = useToast();
  return (
    <button
      type="button"
      onClick={() => onClick(toast)}
    >
      Fire
    </button>
  );
}

function renderHarness(onClick: (t: ReturnType<typeof useToast>["toast"]) => void) {
  return render(
    <ToastProvider>
      <Harness onClick={onClick} />
    </ToastProvider>
  );
}

describe("ToastProvider", () => {
  it("renders a toast with title and description on demand", async () => {
    const user = userEvent.setup();
    renderHarness((toast) =>
      toast({ title: "Export ready", description: "meters.csv", variant: "success" })
    );
    await user.click(screen.getByRole("button", { name: "Fire" }));
    expect(await screen.findByText("Export ready")).toBeInTheDocument();
    expect(screen.getByText("meters.csv")).toBeInTheDocument();
  });

  it.each([
    ["success", "status"],
    ["info", "status"],
    ["warning", "status"],
    ["error", "alert"],
  ] as const)("renders %s toasts with role=%s", async (variant, role) => {
    const user = userEvent.setup();
    renderHarness((toast) => toast({ title: `Msg ${variant}`, variant }));
    await user.click(screen.getByRole("button", { name: "Fire" }));
    expect(await screen.findByText(`Msg ${variant}`)).toBeInTheDocument();
    expect(screen.getByRole(role)).toBeInTheDocument();
  });

  it("dismisses via the close button", async () => {
    const user = userEvent.setup();
    renderHarness((toast) => toast({ title: "Temporary", variant: "info" }));
    await user.click(screen.getByRole("button", { name: "Fire" }));
    await screen.findByText("Temporary");
    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByText("Temporary")).not.toBeInTheDocument();
  });  it("auto-dismisses after the duration", async () => {
    vi.useFakeTimers();

    // Under fake timers, user-event's async click machinery hangs, so capture
    // the toast fn from the harness callback and fire it inside act().
    let toastFn: ReturnType<typeof useToast>["toast"] | undefined;
    renderHarness((t) => {
      toastFn = t;
    });
    // Capture the toast fn, then fire it inside act() (fake-timer safe).
    fireEvent.click(screen.getByRole("button", { name: "Fire" }));
    act(() => {
      toastFn?.({ title: "Vanishing", variant: "info", duration: 1000 });
    });
    expect(screen.getByText("Vanishing")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(screen.queryByText("Vanishing")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("keeps persistent toasts until manually dismissed", async () => {
    vi.useFakeTimers();

    let toastFn: ReturnType<typeof useToast>["toast"] | undefined;
    renderHarness((t) => {
      toastFn = t;
    });
    fireEvent.click(screen.getByRole("button", { name: "Fire" }));
    act(() => {
      toastFn?.({ title: "Sticky", variant: "error", persistent: true });
    });
    expect(screen.getByText("Sticky")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });
    expect(screen.getByText("Sticky")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("pauses auto-dismiss while hovered and resumes on leave", async () => {
    vi.useFakeTimers();

    let toastFn: ReturnType<typeof useToast>["toast"] | undefined;
    renderHarness((t) => {
      toastFn = t;
    });
    fireEvent.click(screen.getByRole("button", { name: "Fire" }));
    act(() => {
      toastFn?.({ title: "Hover me", variant: "info", duration: 1000 });
    });
    const region = screen.getByText("Hover me");
    const card = region.closest("[role='status']") as HTMLElement;

    // fireEvent fires synchronously, which is compatible with fake timers
    fireEvent.mouseEnter(card);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(screen.getByText("Hover me")).toBeInTheDocument();

    fireEvent.mouseLeave(card);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(screen.queryByText("Hover me")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
