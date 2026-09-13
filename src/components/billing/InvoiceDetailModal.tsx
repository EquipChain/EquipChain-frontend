"use client";

import { useRef } from "react";
import { Printer } from "lucide-react";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { StatusBadge } from "@/src/components/ui/Badge";
import {
  InvoiceTemplate,
  usePrintInvoice,
  type InvoiceData,
} from "@/src/components/export/InvoiceTemplate";
import type { Invoice } from "@/src/lib/types/domain";

// ============================================================================
// InvoiceDetailModal — one invoice, focused, printable
// ============================================================================
// The billing page's invoice preview was an inline block above the table:
// opening it scrolled the table out of view, it always showed the first
// invoice unless you found the toolbar toggle, and printing dragged the
// whole page chrome along. This modal shows exactly one invoice with a
// print action that prints just the invoice.

export interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  /** Builds the print-layout data from the typed invoice record */
  toInvoiceData: (invoice: Invoice) => InvoiceData;
}

export function InvoiceDetailModal({
  invoice,
  onClose,
  toInvoiceData,
}: InvoiceDetailModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const printInvoice = usePrintInvoice(contentRef);

  if (!invoice) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Invoice ${invoice.id}`}
      description={`${invoice.status} · due ${invoice.dueDate}`}
      size="lg"
      footer={
        <>
          <StatusBadge status={invoice.status} />
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              try {
                printInvoice();
              } catch (error) {
                // Popup blocked — surface it instead of failing silently.
                console.error(error);
                window.alert(
                  "Unable to open the print window. Please allow popups for this site."
                );
              }
            }}
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print
          </Button>
        </>
      }
    >
      <InvoiceTemplate data={toInvoiceData(invoice)} contentRef={contentRef} />
    </Modal>
  );
}
