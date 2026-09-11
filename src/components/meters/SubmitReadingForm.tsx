"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Field } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/toast";
import { useFormValidation } from "@/src/lib/hooks/useFormValidation";
import { meterReadingSchema } from "@/src/lib/validation/schemas";
import { useMeters } from "@/src/lib/api/hooks";

// ============================================================================
// SubmitReadingForm — validated manual reading entry
// ============================================================================
// Meters report automatically, but device gaps and manual audits need a
// way to enter a reading by hand. Validated against meterReadingSchema
// (meter ID + positive reading + timestamp), then queued offline-safe.

interface FormValues {
  meterId: string;
  reading: string;
}

const EMPTY_FORM: FormValues = { meterId: "", reading: "" };

export function SubmitReadingForm({ defaultMeterId }: { defaultMeterId?: string }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>({
    ...EMPTY_FORM,
    meterId: defaultMeterId ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { data: meters } = useMeters();
  const { toast } = useToast();

  const getValues = useCallback(
    () => ({
      meterId: values.meterId,
      reading: values.reading,
      timestamp: Date.now(),
    }),
    [values]
  );

  const { errors, validate, validateField, clearFieldError, submitAttempted } =
    useFormValidation(meterReadingSchema, getValues);

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
        description: "The reading could not be validated.",
        variant: "warning",
      });
      return;
    }

    setSubmitting(true);
    try {
      // TODO(seam): replace with contract invocation after wallet integration.
      const { enqueueOperation } = await import("@/src/lib/storage/db");
      await enqueueOperation("meter-reading", {
        kind: "submit-reading",
        ...parsed,
        timestamp: Date.now(),
      });
      window.dispatchEvent(new Event("equipchain:queue-changed"));
      toast({
        title: "Reading queued",
        description: `${parsed.meterId}: ${parsed.reading} will sync when you're online.`,
        variant: "success",
      });
      setValues(EMPTY_FORM);
      setOpen(false);
    } catch {
      toast({
        title: "Could not queue reading",
        description: "Local storage is unavailable in this browser session.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" aria-hidden="true" />
        Submit reading
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Submit a meter reading"
        description="Manual readings sync like device readings — validated before queueing."
      >
        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
          <Field
            label="Meter"
            required
            error={errors.meterId}
            inputProps={{
              id: "readingMeterId",
              name: "meterId",
              list: "meter-id-options",
              value: values.meterId,
              onChange: setField("meterId"),
              onBlur: () => validateField("meterId"),
              placeholder: "meter-001",
              autoComplete: "off",
            }}
          >
            {/* Datalist lives inside the field wrapper; Field renders
                children after the input when provided. */}
          </Field>
          <datalist id="meter-id-options">
            {(meters ?? []).map((meter) => (
              <option key={meter.id} value={meter.id}>
                {meter.name}
              </option>
            ))}
          </datalist>

          <Field
            label="Reading"
            required
            error={errors.reading}
            hint="Cumulative meter value in the meter's unit."
            inputProps={{
              id: "readingValue",
              name: "reading",
              type: "number",
              min: 0,
              step: "any",
              value: values.reading,
              onChange: setField("reading"),
              onBlur: () => validateField("reading"),
              placeholder: "15420",
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
              {submitting ? "Queueing…" : "Submit reading"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
