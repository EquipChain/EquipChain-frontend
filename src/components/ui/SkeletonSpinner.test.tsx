import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton, SkeletonCard } from "./Skeleton";
import { Spinner } from "./Spinner";

describe("Skeleton", () => {
  it("renders as an aria-hidden decorative block", () => {
    const { container } = render(<Skeleton className="w-32" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("animate-pulse", "w-32", "rounded-md");
  });

  it("renders circular variant", () => {
    const { container } = render(<Skeleton circle />);
    expect(container.firstElementChild).toHaveClass("rounded-full");
  });
});

describe("SkeletonCard", () => {
  it("marks its container aria-busy and renders three bars", () => {
    const { container } = render(<SkeletonCard />);
    const card = container.firstElementChild as HTMLElement;
    expect(card).toHaveAttribute("aria-busy", "true");
    expect(card.querySelectorAll(".animate-pulse").length).toBe(3);
  });
});

describe("Spinner", () => {
  it("exposes role=status with an sr-only label", () => {
    const { container } = render(<Spinner label="Loading meters" />);
    const status = container.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status?.textContent).toContain("Loading meters");
    const srOnly = status?.querySelector(".sr-only");
    expect(srOnly).not.toBeNull();
  });

  it("applies size presets to the icon", () => {
    const { container } = render(<Spinner size="lg" />);
    expect(container.querySelector("svg")).toHaveClass("h-8", "w-8");
  });

  it("defaults to md size", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector("svg")).toHaveClass("h-6", "w-6");
  });
});
