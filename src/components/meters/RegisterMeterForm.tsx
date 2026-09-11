"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Field } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/toast";
import { useFormValidation } from "@/src/lib/hooks/useFormValidation";
import { meterRegistrationSchema } from "@/src/lib/validation/schemas";

// ============================================================================
// RegisterMeterForm — validated meter registration dialog
// ============================================================================
// Meter registration is the platform's core write operation, but the UI
// for it never existed. This form validates meter ID, initial reading,
// rate, and owner address against the shared zod schema before any
// on-chain call, then surfaces the outcome via toast. The actual contract
// invocation is a marked seam: the offline queue accepts the payload so
// submissions made offline replay when connectivity returns.

interface FormValues {
  meterId: string;
  initialReading: string;
  rate: string;
  ownerAddress: string;
}

const EMPTY_FORM: FormValues = {
  meterId: "",
  initialReading: "",
  rate: "",
  ownerAddress: "",
};

export function RegisterMeterForm() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const getValues = useCallback(() => values, [values]);
  const {
    errors,
    validate,
    validateField,
    clearFieldError,
    submitAttempted,
  } = useFormValidation(meterRegistrationSchema, getValues);

  const setField =
    (field: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));
      if (submitAttempted || errors[field]) clearFieldError(field);
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = validate();
    if (!parsed) {
      toast({
        title: "Check the highlighted fields",
        description: "Some values are invalid.",
        variant: "warning",
      });
      return;
    }

    setSubmitting(true);
    try {
      // TODO(seam): replace with the contract invocation once wallet
      // integration lands. Queueing offline-safe keeps the form usable
      // before the backend is connected.
      const { enqueueOperation } = await import("@/src/lib/storage/db");
      await enqueueOperation("meter-reading", {
        kind: "register-meter",
        ...parsed,
      });
      window.dispatchEvent(new Event("equipchain:queue-changed"));
      toast({
        title: "Meter registration queued",
        description: `${parsed.meterId} will register when you're online.`,
        variant: "success",
      });
      setValues(EMPTY_FORM);
      setOpen(false);
    } catch {
      toast({
        title: "Could not queue registration",
        description: "Local storage is unavailable in this browser session.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Register meter
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Register a meter"
        description="All fields are validated before the on-chain call."
      >
        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
          <Field
            label="Meter ID"
            required
            error={errors.meterId}
            hint="Letters, numbers, hyphens, and underscores."
            inputProps={{
              id: "meterId",
              name: "meterId",
              value: values.meterId,
              onChange: setField("meterId"),
              onBlur: () => validateField("meterId"),
              placeholder: "meter-004",
              autoComplete: "off",
            }}
          />

          <Field
            label="Initial reading"
            required
            error={errors.initialReading}
            inputProps={{
              id: "initialReading",
              name: "initialReading",
              type: "number",
              min: 0,
              step: "any",
              value: values.initialReading,
              onChange: setField("initialReading"),
              onBlur: () => validateField("initialReading"),
              placeholder: "0",
            }}
          />

          <Field
            label="Rate (USD per unit)"
            required
            error={errors.rate}
            inputProps={{
              id: "rate",
              name: "rate",
              type: "number",
              min: 0,
              step: "any",
              value: values.rate,
              onChange: setField("rate"),
              onBlur: () => validateField("rate"),
              placeholder: "0.12",
            }}
          />

          <Field
            label="Owner address"
            required
            error={errors.ownerAddress}
            hint="Stellar public key starting with G."
            inputProps={{
              id: "ownerAddress",
              name: "ownerAddress",
              value: values.ownerAddress,
              onChange: setField("ownerAddress"),
              onBlur: () => validateField("ownerAddress"),
              placeholder: "GABC…",
              autoComplete: "off",
              spellCheck: false,
            }}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {submitting ? "Queueing…" : "Register meter"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
