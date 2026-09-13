import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InvoiceDetailModal } from "./InvoiceDetailModal";
import type { Invoice } from "@/src/lib/types/domain";

const INVOICE: Invoice = {
  id: "INV-2026-002",
  meterId: "meter-002",
  periodStart: "2026-02-01",
  periodEnd: "2026-02-28",
  consumption: 8200,
  rate: 0.05,
  amount: 410,
  status: "Pending",
  dueDate: "2026-03-05",
};

const TO_DATA = (invoice: Invoice) => ({
  invoiceNumber: invoice.id,
  issueDate: invoice.periodEnd,
  dueDate: invoice.dueDate,
  companyName: "EquipChain Utilities",
  companyAddress: "1 Test Way",
  customerName: "Acme Corp",
  customerAddress: "2 Test Way",
  lineItems: [
    {
      meterId: invoice.meterId,
      period: "Feb 2026",
      consumption: String(invoice.consumption),
      rate: `$${invoice.rate}/unit`,
      amount: `$${invoice.amount}.00`,
    },
  ],
  subtotal: `$${invoice.amount}.00`,
  taxRate: "0",
  taxAmount: "$0.00",
  totalDue: `$${invoice.amount}.00`,
  paymentTerms: "Net 30",
});

describe("InvoiceDetailModal", () => {
  it("renders nothing when no invoice is selected", () => {
    render(
      <InvoiceDetailModal invoice={null} onClose={() => {}} toInvoiceData={TO_DATA} />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the focused invoice with status and line items", () => {
    render(
      <InvoiceDetailModal invoice={INVOICE} onClose={() => {}} toInvoiceData={TO_DATA} />
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Invoice INV-2026-002");
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("meter-002")).toBeInTheDocument();
    expect(screen.getByText("Total Due")).toBeInTheDocument();
  });

  it("closes via the Close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <InvoiceDetailModal invoice={INVOICE} onClose={onClose} toInvoiceData={TO_DATA} />
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("offers a Print action without triggering it on render", () => {
    const printSpy = vi.spyOn(window, "open");
    render(
      <InvoiceDetailModal invoice={INVOICE} onClose={() => {}} toInvoiceData={TO_DATA} />
    );
    expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument();
    expect(printSpy).not.toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
