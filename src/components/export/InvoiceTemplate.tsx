"use client";

import { useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

interface InvoiceLineItem {
  meterId: string;
  period: string;
  consumption: string;
  rate: string;
  amount: string;
}

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  companyName: string;
  companyAddress: string;
  customerName: string;
  customerAddress: string;
  lineItems: InvoiceLineItem[];
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  totalDue: string;
  paymentTerms: string;
  notes?: string;
}

interface InvoiceTemplateProps {
  /** Invoice data to render */
  data: InvoiceData;
  /** Called to get a ref for PDF generation */
  contentRef?: React.RefObject<HTMLDivElement | null>;
}

// ============================================================================
// Component
// ============================================================================

export function InvoiceTemplate({ data, contentRef }: InvoiceTemplateProps) {
  return (
    <div
      ref={contentRef}
      className="bg-white text-gray-900 p-8 max-w-3xl mx-auto font-sans"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-900">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            INVOICE
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            #{data.invoiceNumber}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">{data.companyName}</p>
          {data.companyAddress.split("\n").map((line, i) => (
            <p key={i} className="text-sm text-gray-500">
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Bill To / Dates */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Bill To
          </p>
          <p className="font-medium text-gray-900">{data.customerName}</p>
          {data.customerAddress.split("\n").map((line, i) => (
            <p key={i} className="text-sm text-gray-500">
              {line}
            </p>
          ))}
        </div>
        <div className="text-right">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Issue Date
            </p>
            <p className="text-sm text-gray-700">{data.issueDate}</p>
          </div>
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Due Date
            </p>
            <p className="text-sm text-gray-700">{data.dueDate}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Payment Terms
            </p>
            <p className="text-sm text-gray-700">{data.paymentTerms}</p>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-y-2 border-gray-900">
            <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Meter ID
            </th>
            <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Period
            </th>
            <th className="text-right py-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Consumption
            </th>
            <th className="text-right py-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Rate
            </th>
            <th className="text-right py-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {data.lineItems.map((item, index) => (
            <tr
              key={index}
              className="border-b border-gray-200 hover:bg-gray-50"
            >
              <td className="py-3 px-2 text-sm text-gray-900">
                {item.meterId}
              </td>
              <td className="py-3 px-2 text-sm text-gray-600">
                {item.period}
              </td>
              <td className="py-3 px-2 text-sm text-gray-900 text-right">
                {item.consumption}
              </td>
              <td className="py-3 px-2 text-sm text-gray-900 text-right">
                {item.rate}
              </td>
              <td className="py-3 px-2 text-sm text-gray-900 text-right font-medium">
                {item.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-900">{data.subtotal}</span>
          </div>
          <div className="flex justify-between py-2 text-sm border-b border-gray-200">
            <span className="text-gray-500">Tax ({data.taxRate}%)</span>
            <span className="text-gray-900">{data.taxAmount}</span>
          </div>
          <div className="flex justify-between py-3 text-base font-bold border-t-2 border-gray-900 mt-2">
            <span>Total Due</span>
            <span>{data.totalDue}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Notes
          </p>
          <p className="text-sm text-gray-600">{data.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">
          Generated by EquipChain &middot; {data.invoiceNumber} &middot;{" "}
          {data.issueDate}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Hook: usePrintInvoice
// ============================================================================

/**
 * Hook that provides a print function for an InvoiceTemplate ref.
 *
 * @example
 * ```tsx
 * const contentRef = useRef<HTMLDivElement>(null);
 * const printInvoice = usePrintInvoice(contentRef);
 * return (
 *   <>
 *     <InvoiceTemplate data={invoice} contentRef={contentRef} />
 *     <button onClick={printInvoice}>Print Invoice</button>
 *   </>
 * );
 * ```
 */
export function usePrintInvoice(
  contentRef: React.RefObject<HTMLDivElement | null>
) {
  return useCallback(() => {
    const element = contentRef.current;
    if (!element) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      throw new Error("Unable to open print window. Please allow popups.");
    }

    const styles = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 20mm; size: A4; }
        }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${element.querySelector("h1 + p")?.textContent ?? ""}</title>
          ${styles}
        </head>
        <body>
          ${element.innerHTML}
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [contentRef]);
}

export type { InvoiceData, InvoiceLineItem };
