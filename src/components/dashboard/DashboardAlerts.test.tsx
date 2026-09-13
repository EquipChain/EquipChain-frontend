import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// The component consumes the shared SWR hook; mock it instead of the
// fetcher layer so tests exercise only the alert logic.
const mockUseInvoices = vi.fn();
vi.mock("@/src/lib/api/hooks", () => ({
  useInvoices: () => mockUseInvoices(),
}));

import { DashboardAlerts, GasBufferCriticalNote } from "./DashboardAlerts";
import type { Invoice } from "@/src/lib/types/domain";

function invoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: "INV-2026-003",
    meterId: "meter-003",
    periodStart: "2026-02-01",
    periodEnd: "2026-02-28",
    consumption: 3050,
    rate: 0.08,
    amount: 244,
    status: "Overdue",
    dueDate: "2026-03-01",
    ...overrides,
  };
}

describe("DashboardAlerts", () => {
  it("renders nothing when there are no overdue invoices", () => {
    mockUseInvoices.mockReturnValue({
      data: [invoice({ id: "INV-1", status: "Paid" })],
    });
    const { container } = render(<DashboardAlerts />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while invoice data is loading", () => {
    mockUseInvoices.mockReturnValue({ data: undefined });
    const { container } = render(<DashboardAlerts />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists overdue invoices with amount and due date, linked to billing", async () => {
    const user = userEvent.setup();
    mockUseInvoices.mockReturnValue({
      data: [
        invoice({ id: "INV-2026-003", amount: 244, dueDate: "2026-03-01" }),
        invoice({ id: "INV-2026-009", amount: 96.5, dueDate: "2026-03-04" }),
      ],
    });
    render(<DashboardAlerts />);

    const section = screen.getByRole("region", { name: "Action required" });
    expect(section).toHaveTextContent("Invoice INV-2026-003 is overdue");
    expect(section).toHaveTextContent("$96.50");
    expect(section).toHaveTextContent("Mar 4, 2026");

    const link = screen.getByRole("link", { name: /Invoice INV-2026-009 is overdue/ });
    await user.click(link);
    // Link target asserted via attribute; navigation itself is router-side.
    expect(link).toHaveAttribute("href", "/billing");
  });

  it("ignores pending invoices", () => {
    mockUseInvoices.mockReturnValue({
      data: [invoice({ id: "INV-2", status: "Pending" })],
    });
    render(<DashboardAlerts />);
    expect(screen.queryByRole("region", { name: "Action required" })).not.toBeInTheDocument();
  });
});

describe("GasBufferCriticalNote", () => {
  it("renders an alert when the balance is below the floor", () => {
    render(<GasBufferCriticalNote balance={45.2} floorXlm={100} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/below the 100 XLM operating floor/);
  });

  it("renders nothing when the balance is at or above the floor", () => {
    const { container } = render(<GasBufferCriticalNote balance={120} floorXlm={100} />);
    expect(container).toBeEmptyDOMElement();
  });
});
