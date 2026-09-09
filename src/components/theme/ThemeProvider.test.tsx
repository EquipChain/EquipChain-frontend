import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";

function Probe() {
  const { theme, resolvedTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
    </div>
  );
}

function renderWithProvider(initial: "light" | "dark" | "system" = "system") {
  return render(
    <ThemeProvider initialTheme={initial}>
      <Probe />
    </ThemeProvider>
  );
}

describe("ThemeProvider", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
    document.cookie = "equipchain-theme=; path=/; max-age=0";
    cleanup();
  });

  it("defaults to system and resolves according to matchMedia", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    );

    renderWithProvider("system");
    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    vi.unstubAllGlobals();
  });

  it("applies the dark class when dark is explicitly chosen", () => {
    renderWithProvider("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("switches to light, updates the class, and persists to cookie", () => {
    render(
      <ThemeProvider initialTheme="dark">
        <Probe />
        <ThemeToggle />
      </ThemeProvider>
    );
    fireEvent.click(screen.getByRole("radio", { name: "Light theme" }));
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.cookie).toContain("equipchain-theme=light");
  });

  it("renders the toggle as a radiogroup with three options", () => {
    render(
      <ThemeProvider initialTheme="system">
        <ThemeToggle />
      </ThemeProvider>
    );
    const group = screen.getByRole("radiogroup", { name: "Color theme" });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(
      screen.getByRole("radio", { name: "Match system theme" })
    ).toHaveAttribute("aria-checked", "true");
  });
});
