import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sparkline } from "./Sparkline";

describe("Sparkline", () => {
  it("renders an SVG with a path for a valid series", () => {
    const { container } = render(
      <Sparkline data={[1, 3, 2, 5, 4]} ariaLabel="Usage trend" />
    );
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.querySelector("path")).not.toBeNull();
    expect(screen.getByLabelText("Usage trend")).toBeInTheDocument();
  });

  it("renders an area fill path when fill is enabled", () => {
    const { container } = render(
      <Sparkline data={[1, 2, 3]} ariaLabel="filled" fill />
    );
    // line path + area path
    expect(container.querySelectorAll("path").length).toBe(2);
  });

  it("omits the area path when fill is disabled", () => {
    const { container } = render(
      <Sparkline data={[1, 2, 3]} ariaLabel="line only" fill={false} />
    );
    expect(container.querySelectorAll("path").length).toBe(1);
  });

  it("shows a fallback message for short series", () => {
    render(<Sparkline data={[1]} ariaLabel="too short" />);
    expect(screen.getByText("Not enough data")).toBeInTheDocument();
  });

  it("handles flat series without NaN coordinates", () => {
    const { container } = render(
      <Sparkline data={[5, 5, 5, 5]} ariaLabel="flat" />
    );
    const line = container.querySelectorAll("path")[container.querySelectorAll("path").length - 1];
    expect(line?.getAttribute("d")).not.toContain("NaN");
  });
});
