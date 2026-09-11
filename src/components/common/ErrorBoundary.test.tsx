import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "./ErrorBoundary";

/** Component that throws only when `shouldThrow` is true. */
function Bomb({ shouldThrow }: { shouldThrow: boolean }): React.JSX.Element {
  if (shouldThrow) throw new Error("kaboom");
  return <p>all good</p>;
}

// React logs caught errors via console.error; silence for cleaner output.
afterEach(() => {
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary sectionName="widget">
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText("all good")).toBeInTheDocument();
  });

  it("renders the fallback when a child throws", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary sectionName="consumption chart">
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText(/The consumption chart failed to load/)
    ).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("recovers when Retry resets the boundary", async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let shouldThrow = true;

    const { rerender } = render(
      <ErrorBoundary sectionName="widget">
        <Bomb shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Stop throwing and retry — the boundary remounts children.
    shouldThrow = false;
    rerender(
      <ErrorBoundary sectionName="widget">
        <Bomb shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(screen.getByText("all good")).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("uses a custom fallback when provided", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary
        fallback={(reset) => (
          <button type="button" onClick={reset}>
            custom reset
          </button>
        )}
      >
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByRole("button", { name: "custom reset" })).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("reports through onError when provided", () => {
    const onError = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary sectionName="widget" onError={onError}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledTimes(1);
    const [error] = onError.mock.calls[0];
    expect(error.message).toBe("kaboom");
    // Our component's own logging is skipped when onError is wired; React
    // still logs the recoverable error internally, so assert on our message
    // not being present rather than on console.error being untouched.
    const consoleCalls = consoleSpy.mock.calls.flat().join(" ");
    expect(consoleCalls).not.toContain("[widget-error");
  });
});
