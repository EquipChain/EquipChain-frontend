"use client";

import { SubmitReadingForm } from "./SubmitReadingForm";

// ============================================================================
// MeterDetailActions — in-context actions for one meter
// ============================================================================
// Submitting a reading for a specific meter required a trip to the meters
// list, finding the row, and picking the meter out of a combobox — even
// when already looking at the meter's profile page. This wrapper places the
// validated reading form directly on the detail page with the meter
// preselected, so the context switch disappears.

export function MeterDetailActions({ meterId }: { meterId: string }) {
  return <SubmitReadingForm defaultMeterId={meterId} label="Submit reading for this meter" />;
}
