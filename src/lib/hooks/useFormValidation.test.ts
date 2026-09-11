import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { useFormValidation } from "./useFormValidation";

const schema = z.object({
  meterId: z
    .string()
    .min(1, "Meter ID is required")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid characters"),
  reading: z.string().refine((v) => Number(v) > 0, "Must be positive"),
});

describe("useFormValidation", () => {
  function setup(values: Record<string, string>) {
    return renderHook(() =>
      useFormValidation(schema, () => values as never)
    );
  }

  it("returns parsed data when the form is valid", () => {
    const { result } = setup({ meterId: "meter-1", reading: "42" });
    let parsed: unknown;
    act(() => {
      parsed = result.current.validate();
    });
    expect(parsed).toEqual({ meterId: "meter-1", reading: "42" });
    expect(result.current.errors).toEqual({});
    expect(result.current.submitAttempted).toBe(true);
  });

  it("collects the first message per failing field", () => {
    const { result } = setup({ meterId: "bad chars!", reading: "-5" });
    let parsed: unknown;
    act(() => {
      parsed = result.current.validate();
    });
    expect(parsed).toBeNull();
    expect(result.current.errors.meterId).toBe("Invalid characters");
    expect(result.current.errors.reading).toBe("Must be positive");
  });

  it("reports required-field errors", () => {
    const { result } = setup({ meterId: "", reading: "" });
    act(() => {
      result.current.validate();
    });
    expect(result.current.errors.meterId).toBe("Meter ID is required");
  });

  it("validateField updates only the target field", () => {
    let values = { meterId: "", reading: "-5" };
    const { result, rerender } = renderHook(() =>
      useFormValidation(schema, () => values as never)
    );
    act(() => {
      result.current.validateField("meterId");
    });
    expect(result.current.errors.meterId).toBe("Meter ID is required");
    expect(result.current.errors.reading).toBeUndefined();

    // User fixes the field; blur revalidates just that field.
    values = { meterId: "meter-1", reading: "-5" };
    rerender();
    act(() => {
      result.current.validateField("meterId");
    });
    expect(result.current.errors.meterId).toBeUndefined();
    expect(result.current.errors.reading).toBeUndefined();
  });

  it("clearFieldError removes a single error", () => {
    const { result } = setup({ meterId: "", reading: "" });
    act(() => {
      result.current.validate();
    });
    act(() => {
      result.current.clearFieldError("meterId");
    });
    expect(result.current.errors.meterId).toBeUndefined();
    expect(result.current.errors.reading).toBe("Must be positive");
  });

  it("clearErrors empties the map", () => {
    const { result } = setup({ meterId: "", reading: "" });
    act(() => {
      result.current.validate();
    });
    act(() => {
      result.current.clearErrors();
    });
    expect(result.current.errors).toEqual({});
  });
});
