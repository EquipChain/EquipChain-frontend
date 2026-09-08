import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children and default type=button", () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).toBeEnabled();
  });

  it("applies the variant classes", () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-error");
  });

  it("is disabled and shows a spinner while loading", () => {
    render(<Button loading>Exporting</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("does not fire onClick when loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Go
      </Button>
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("fires onClick on click", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("supports fullWidth", () => {
    render(<Button fullWidth>Wide</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });

  it("forwards refs to the underlying button element", () => {
    let el: HTMLButtonElement | null = null;
    render(
      <Button
        ref={(node) => {
          el = node;
        }}
      >
        Ref
      </Button>
    );
    expect(el).not.toBeNull();
    expect(el).toBeInstanceOf(HTMLButtonElement);
  });
});
