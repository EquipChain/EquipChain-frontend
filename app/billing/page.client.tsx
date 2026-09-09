"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { ExportButton } from "@/src/components/export/ExportButton";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "@/src/components/ui/DataTable";
import { StatusBadge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
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
interface BillingRow {
  [key: string]: unknown;
  id: string;
  meterId: string;
  period: string;
  consumption: string;
  rate: string;
  amount: string;
  status: string;
  dueDate: string;
}

const sampleBillingData: BillingRow[] = [
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

const billingTableColumns: DataTableColumn<BillingRow>[] = [
  { key: "id", header: "Invoice #", mobileTitle: true },
  { key: "meterId", header: "Meter ID" },
  { key: "period", header: "Period" },
  { key: "consumption", header: "Consumption", align: "right" },
  { key: "rate", header: "Rate", align: "right" },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (row) => (
      <span className="font-medium text-text-primary">{row.amount}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} />,
  },
  { key: "dueDate", header: "Due Date" },
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
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Billing"
        description="View billing history, manage payments, and track usage costs."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowInvoice(!showInvoice)}
              aria-expanded={showInvoice}
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              {showInvoice ? "Hide Invoice" : "View Invoice"}
            </Button>
            <ExportButton
              title="Billing History"
              dataType="billing"
              columns={BILLING_COLUMNS}
              data={sampleBillingData}
              label="Export"
              variant="secondary"
            />
          </>
        }
      />

      {/* Invoice Template (PDF printable) */}
      {showInvoice && (
        <div className="w-full overflow-hidden rounded-xl border border-border shadow-lg">
          <InvoiceTemplate data={sampleInvoice} />
        </div>
      )}

      <DataTable
        columns={billingTableColumns}
        rows={sampleBillingData}
        getRowId={(row) => row.id}
        initialSortKey="id"
        caption={`${sampleBillingData.length} invoices`}
        ariaLabel="Billing history"
      />
    </div>
  );
}
