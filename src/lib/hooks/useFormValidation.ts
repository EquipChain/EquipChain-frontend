"use client";

import { useCallback, useState } from "react";
import type { ZodType } from "zod";
import type { FieldErrors } from "@/src/lib/types/forms";

// ============================================================================
// useFormValidation — zod schema binding for plain React forms
// ============================================================================
// The app validates nothing client-side today: zod schemas exist
// (src/lib/validation/schemas.ts) but no form ever uses them, so invalid
// Stellar addresses, negative readings, and empty meter IDs would only be
// rejected (if at all) after a wallet transaction is already signed. This
// hook binds a schema to form state without pulling in react-hook-form —
// the forms here are small and controlled.

export interface UseFormValidationResult<T> {
  errors: FieldErrors<T>;
  /** Validates all fields; returns parsed data on success, null on failure. */
  validate: () => T | null;
  /** Validates a single field on blur (eager per-field feedback). */
  validateField: (field: keyof T & string) => void;
  /** Clears one field's error as the user fixes it. */
  clearFieldError: (field: keyof T & string) => void;
  /** Clears the whole error map (e.g. on successful submit). */
  clearErrors: () => void;
  /** True once the user has attempted a submit (gates error display). */
  submitAttempted: boolean;
  markSubmitAttempted: () => void;
}

/**
 * @param schema zod schema describing the whole form shape
 * @param getValues current form values (called at validation time)
 */
export function useFormValidation<T extends object>(
  schema: ZodType<T>,
  getValues: () => T
): UseFormValidationResult<T> {
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const runSchema = useCallback((): {
    data: T | null;
    fieldErrors: FieldErrors<T>;
  } => {
    const result = schema.safeParse(getValues());
    if (result.success) {
      return { data: result.data, fieldErrors: {} };
    }
    const fieldErrors: FieldErrors<T> = {};
    for (const issue of result.error.issues) {
      const field = String(issue.path[0] ?? "form") as keyof T & string;
      // First message per field wins (zod emits all failed checks).
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { data: null, fieldErrors };
  }, [schema, getValues]);

  const validate = useCallback((): T | null => {
    const { data, fieldErrors } = runSchema();
    setErrors(fieldErrors);
    setSubmitAttempted(true);
    return data;
  }, [runSchema]);

  const validateField = useCallback(
    (field: keyof T & string) => {
      const { fieldErrors } = runSchema();
      setErrors((prev) => ({
        ...prev,
        [field]: fieldErrors[field],
      }));
    },
    [runSchema]
  );

  const clearFieldError = useCallback((field: keyof T & string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearErrors = useCallback(() => setErrors({}), []);
  const markSubmitAttempted = useCallback(() => setSubmitAttempted(true), []);

  return {
    errors,
    validate,
    validateField,
    clearFieldError,
    clearErrors,
    submitAttempted,
    markSubmitAttempted,
  };
}
