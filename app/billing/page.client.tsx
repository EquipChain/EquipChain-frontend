"use client";

import { useMemo, useState } from "react";
import { FileText, Receipt } from "lucide-react";
import { ExportButton } from "@/src/components/export/ExportButton";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "@/src/components/ui/DataTable";
import { StatusBadge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { InvoiceTemplate } from "@/src/components/export/InvoiceTemplate";
import type { InvoiceData } from "@/src/components/export/InvoiceTemplate";
import { useInvoices } from "@/src/lib/api/hooks";
import {
  formatCurrency,
  formatDate,
} from "@/src/lib/utils/format";
import type { Invoice } from "@/src/lib/types/domain";

// ============================================================================
// Billing page — typed invoice table with aggregates
// ============================================================================
// Previously this page inlined literal rows with pre-formatted currency
// strings, so the table could not total anything, sorting compared
// "$1,494.00" lexically, and the invoice preview was always the same
// hard-coded sample regardless of the table. It now derives everything
// from useInvoices().

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

interface BillingExportRow {
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

function toExportRow(invoice: Invoice): BillingExportRow {
  return {
    id: invoice.id,
    meterId: invoice.meterId,
    period: `${formatDate(invoice.periodStart)} – ${formatDate(invoice.periodEnd)}`,
    consumption: String(invoice.consumption),
    rate: formatCurrency(invoice.rate, "USD", 2),
    amount: formatCurrency(invoice.amount, "USD", 2),
    status: invoice.status,
    dueDate: invoice.dueDate,
  };
}

/** Builds printable invoice data from a typed invoice record. */
function toInvoiceData(invoice: Invoice): InvoiceData {
  return {
    invoiceNumber: invoice.id,
    issueDate: formatDate(invoice.periodEnd),
    dueDate: formatDate(invoice.dueDate),
    companyName: "EquipChain Utilities",
    companyAddress: "123 Blockchain Ave\nSan Francisco, CA 94105",
    customerName: "Acme Corporation",
    customerAddress: "456 Industrial Pkwy\nBuilding 7, Suite 300\nOakland, CA 94607",
    lineItems: [
      {
        meterId: invoice.meterId,
        period: `${formatDate(invoice.periodStart)} - ${formatDate(invoice.periodEnd)}`,
        consumption: `${invoice.consumption.toLocaleString()}`,
        rate: `${formatCurrency(invoice.rate, "USD", 2)}/unit`,
        amount: formatCurrency(invoice.amount, "USD", 2),
      },
    ],
    subtotal: formatCurrency(invoice.amount, "USD", 2),
    taxRate: "0",
    taxAmount: formatCurrency(0, "USD", 2),
    totalDue: formatCurrency(invoice.amount, "USD", 2),
    paymentTerms: "Net 30",
    notes:
      "Please include the invoice number with your payment. " +
      "Settlements are recorded on the Stellar ledger.",
  };
}

export function BillingPageClient() {
  const { data: invoices, isLoading, error } = useInvoices();
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Stable identity for the SWR data fallback so the totals useMemo does
  // not recompute on unrelated renders.
  const rows = useMemo(() => invoices ?? [], [invoices]);

  const totals = useMemo(() => {
    const outstanding = rows
      .filter((i) => i.status === "Pending" || i.status === "Overdue")
      .reduce((sum, i) => sum + i.amount, 0);
    const paid = rows
      .filter((i) => i.status === "Paid")
      .reduce((sum, i) => sum + i.amount, 0);
    return { outstanding, paid, count: rows.length };
  }, [rows]);

  const tableColumns: DataTableColumn<Invoice>[] = [
    { key: "id", header: "Invoice #", mobileTitle: true },
    { key: "meterId", header: "Meter ID" },
    {
      key: "periodStart",
      header: "Period",
      sortValue: (row) => row.periodStart,
      cell: (row) => (
        <span>
          {formatDate(row.periodStart)} – {formatDate(row.periodEnd)}
        </span>
      ),
    },
    {
      key: "consumption",
      header: "Consumption",
      align: "right",
      sortValue: (row) => row.consumption,
      cell: (row) => row.consumption.toLocaleString(),
    },
    {
      key: "rate",
      header: "Rate",
      align: "right",
      sortValue: (row) => row.rate,
      cell: (row) => formatCurrency(row.rate, "USD", 2),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (row) => row.amount,
      cell: (row) => (
        <span className="font-medium text-text-primary">
          {formatCurrency(row.amount, "USD", 2)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "dueDate",
      header: "Due Date",
      sortValue: (row) => row.dueDate,
      cell: (row) => (
        <time dateTime={row.dueDate}>{formatDate(row.dueDate)}</time>
      ),
    },
  ];

  const previewInvoice = rows.find((i) => i.id === previewId) ?? null;

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Billing"
          description="Unable to load invoices. Check your connection and try again."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Billing"
        description="View billing history, manage payments, and track usage costs."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setPreviewId((id) => (id ? null : rows[0]?.id ?? null))}
              aria-expanded={previewId !== null}
              disabled={rows.length === 0}
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              {previewId ? "Hide Invoice" : "View Invoice"}
            </Button>
            <ExportButton
              title="Billing History"
              dataType="billing"
              columns={BILLING_COLUMNS}
              data={rows.map(toExportRow)}
              label="Export"
              variant="secondary"
            />
          </>
        }
      />

      {/* Aggregates — previously impossible with string-typed amounts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-text-muted">Outstanding</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {formatCurrency(totals.outstanding)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-muted">Paid to date</p>
          <p className="mt-1 text-2xl font-bold text-success">
            {formatCurrency(totals.paid)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-muted">Invoices</p>
          <p className="mt-1 inline-flex items-center gap-2 text-2xl font-bold text-text-primary">
            <Receipt className="h-5 w-5 text-text-muted" aria-hidden="true" />
            {totals.count}
          </p>
        </Card>
      </div>

      {/* Invoice preview for the selected row */}
      {previewInvoice && (
        <div className="w-full overflow-hidden rounded-xl border border-border shadow-lg">
          <InvoiceTemplate data={toInvoiceData(previewInvoice)} />
        </div>
      )}

      <DataTable
        columns={tableColumns}
        rows={rows}
        getRowId={(row) => row.id}
        initialSortKey="id"
        loading={isLoading}
        emptyMessage="No invoices yet"
        emptyDescription="Invoices are generated at the end of each billing period."
        searchPlaceholder="Search invoices…"
        caption={`${rows.length} invoices`}
        ariaLabel="Billing history"
        toolbar={
          previewId ? (
            <Button variant="ghost" size="sm" onClick={() => setPreviewId(null)}>
              Clear preview
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
