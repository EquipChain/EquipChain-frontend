import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders a nav with the aria-label", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Meters", href: "/meters" },
        ]}
      />
    );
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders links for non-final items with hrefs", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Meters", href: "/meters" },
          { label: "meter-001" },
        ]}
      />
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Meters" })).toHaveAttribute("href", "/meters");
  });

  it("renders the last item as the current page even if it carries an href", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Meters", href: "/meters" },
          { label: "meter-001", href: "/meters/meter-001" },
        ]}
      />
    );
    const current = screen.getByText("meter-001");
    expect(current.closest("a")).toBeNull();
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("renders separators between items", () => {
    const { container } = render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Meters", href: "/meters" },
          { label: "meter-001" },
        ]}
      />
    );
    // Two separators for three items
    expect(container.querySelectorAll("svg").length).toBe(2);
  });
});
