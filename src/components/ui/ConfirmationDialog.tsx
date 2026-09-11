"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

// ============================================================================
// ConfirmationDialog — guard rail for destructive or irreversible actions
// ============================================================================
// The app is gaining destructive operations (dismiss all queued ops,
// discard a draft reading, delete a stream). A bare window.confirm would
// clash with the design system and is untestable in jsdom; this composes
// the existing Modal with a danger-tone button and an accessible alert
// role so the pattern is one import away.

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when the user confirms the action */
  onConfirm: () => void;
  title: string;
  /** Explain the consequence plainly, e.g. "This removes 3 queued readings." */
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Loading state on the confirm button while the action runs */
  confirming?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirming = false,
}: ConfirmationDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div role="alertdialog" aria-label={title} className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-light dark:bg-red-900/30">
            <AlertTriangle className="h-5 w-5 text-error" aria-hidden="true" />
          </span>
          <p className="text-sm text-text-secondary">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={confirming}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={confirming}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
