import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tooltip } from "./Tooltip";
import { Button } from "./Button";

describe("Tooltip", () => {
  it("renders trigger and hidden tooltip content", () => {
    render(
      <Tooltip content="Copy address">
        <Button>Copy</Button>
      </Tooltip>
    );
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Copy address");
    expect(tooltip.className).toContain("opacity-0");
  });

  it("becomes visible on mouse enter", () => {
    render(
      <Tooltip content="Copy address">
        <Button>Copy</Button>
      </Tooltip>
    );
    const wrapper = screen.getByRole("tooltip").parentElement!;
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByRole("tooltip").className).toContain("opacity-100");
  });

  it("hides again on mouse leave", () => {
    render(
      <Tooltip content="Copy address">
        <Button>Copy</Button>
      </Tooltip>
    );
    const wrapper = screen.getByRole("tooltip").parentElement!;
    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseLeave(wrapper);
    expect(screen.getByRole("tooltip").className).toContain("opacity-0");
  });

  it("becomes visible when the trigger receives keyboard focus", () => {
    render(
      <Tooltip content="Copy address">
        <Button>Copy</Button>
      </Tooltip>
    );
    fireEvent.focus(screen.getByRole("button", { name: "Copy" }));
    expect(screen.getByRole("tooltip").className).toContain("opacity-100");
  });

  it("supports all placements", () => {
    for (const placement of ["top", "bottom", "left", "right"] as const) {
      const { container, unmount } = render(
        <Tooltip content="info" placement={placement}>
          <span>trigger</span>
        </Tooltip>
      );
      expect(container.firstChild).toBeInTheDocument();
      unmount();
    }
  });
});
