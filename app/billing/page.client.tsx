"use client";

import { useState } from "react";
import { ExportButton } from "@/src/components/export/ExportButton";
import { InvoiceTemplate } from "@/src/components/export/InvoiceTemplate";
import type { InvoiceData } from "@/src/components/export/InvoiceTemplate";

// Sample billing columns for export
const BILLING_COLUMNS = [
  { key: "id", label: "Invoice #", enabled: true },
  { key: "meterId", label: "Meter ID", enabled: true },
  { key: "period", label: "Period", enabled: true },
  { key: "consumption", label: "Consumption", enabled: true },
  { key: "rate", label: "Rate", enabled: true },
  { key: "amount", label: "Amount", enabled: true },
  { key: "status", label: "Status", enabled: true },
  { key: "dueDate", label: "Due Date", enabled: true },
];

// Placeholder data — replace with actual API data fetching
const sampleBillingData = [
  {
    id: "INV-2024-001",
    meterId: "meter-001",
    period: "Feb 2024",
    consumption: "12,450 kWh",
    rate: "$0.12/kWh",
    amount: "$1,494.00",
    status: "Paid",
    dueDate: "2024-03-01",
  },
  {
    id: "INV-2024-002",
    meterId: "meter-002",
    period: "Feb 2024",
    consumption: "8,200 gal",
    rate: "$0.05/gal",
    amount: "$410.00",
    status: "Pending",
    dueDate: "2024-03-05",
  },
  {
    id: "INV-2024-003",
    meterId: "meter-003",
    period: "Feb 2024",
    consumption: "3,050 m³",
    rate: "$0.08/m³",
    amount: "$244.00",
    status: "Overdue",
    dueDate: "2024-03-01",
  },
];

// Sample invoice data for the PDF template
const sampleInvoice: InvoiceData = {
  invoiceNumber: "INV-2024-002",
  issueDate: "March 1, 2024",
  dueDate: "March 5, 2024",
  companyName: "EquipChain Utilities",
  companyAddress: "123 Blockchain Ave\nSan Francisco, CA 94105",
  customerName: "Acme Corporation",
  customerAddress: "456 Industrial Pkwy\nBuilding 7, Suite 300\nOakland, CA 94607",
  lineItems: [
    {
      meterId: "meter-001",
      period: "Feb 1 - Feb 29, 2024",
      consumption: "12,450 kWh",
      rate: "$0.12/kWh",
      amount: "$1,494.00",
    },
    {
      meterId: "meter-002",
      period: "Feb 1 - Feb 29, 2024",
      consumption: "8,200 gal",
      rate: "$0.05/gal",
      amount: "$410.00",
    },
    {
      meterId: "meter-003",
      period: "Feb 1 - Feb 29, 2024",
      consumption: "3,050 m³",
      rate: "$0.08/m³",
      amount: "$244.00",
    },
  ],
  subtotal: "$2,148.00",
  taxRate: "8.5",
  taxAmount: "$182.58",
  totalDue: "$2,330.58",
  paymentTerms: "Net 30",
  notes:
    "Please include the invoice number with your payment. " +
    "Late payments are subject to a 1.5% monthly finance charge.",
};

export function BillingPageClient() {
  const [showInvoice, setShowInvoice] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 py-32 px-16 w-full max-w-5xl">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
              Billing
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              View billing history, manage payments, and track usage costs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInvoice(!showInvoice)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-tertiary border border-border transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              {showInvoice ? "Hide Invoice" : "View Invoice"}
            </button>
            <ExportButton
              title="Billing History"
              dataType="billing"
              columns={BILLING_COLUMNS}
              data={sampleBillingData}
              label="Export"
              variant="secondary"
            />
          </div>
        </div>

        {/* Invoice Template (PDF printable) */}
        {showInvoice && (
          <div className="w-full border border-border rounded-xl overflow-hidden shadow-lg">
            <InvoiceTemplate data={sampleInvoice} />
          </div>
        )}

        {/* Data table */}
        <div className="w-full border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary border-b border-border">
              <tr>
                {BILLING_COLUMNS.filter((c) => c.enabled).map((col) => (
                  <th
                    key={col.key}
                    className="text-left px-4 py-3 font-medium text-text-secondary"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleBillingData.map((bill) => (
                <tr
                  key={bill.id}
                  className="border-b border-border-light hover:bg-surface-secondary transition-colors"
                >
                  <td className="px-4 py-3 text-text-primary font-medium">
                    {bill.id}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {bill.meterId}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {bill.period}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {bill.consumption}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{bill.rate}</td>
                  <td className="px-4 py-3 text-text-primary font-medium">
                    {bill.amount}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        bill.status === "Paid"
                          ? "bg-success-light text-success-dark dark:bg-green-900/20 dark:text-green-400"
                          : bill.status === "Pending"
                            ? "bg-warning-light text-warning-dark dark:bg-yellow-900/20 dark:text-yellow-400"
                            : "bg-error-light text-error-dark dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {bill.dueDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
