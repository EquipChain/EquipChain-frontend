"use client";

import useSWR from "swr";
import type {
  DataStream,
  DashboardSummary,
  Invoice,
  Meter,
} from "@/src/lib/types/domain";
import {
  sampleDashboardSummary,
  sampleInvoices,
  sampleMeters,
  sampleStreams,
} from "@/src/lib/fixtures/demo";

// ============================================================================
// Data hooks — SWR-backed accessors for domain entities
// ============================================================================
// Pages currently `import { sampleMeterData } from` nothing — they inline
// literals in the render body, so there is no loading state, no cache, no
// revalidation, and no single place to swap in real endpoints. These hooks
// give components one consistent way to consume data with loading/error
// states and shared caching. The fetchers currently resolve fixtures; each
// function has a single seam (marked TODO) where the backend route slots in.

/** Simulates one async fetch round-trip for the fixture-backed fetchers. */
const FIXTURE_LATENCY_MS = 0;

function fixtureFetcher<T>(data: T): () => Promise<T> {
  return () =>
    new Promise<T>((resolve) => {
      if (FIXTURE_LATENCY_MS <= 0) resolve(data);
      else setTimeout(() => resolve(data), FIXTURE_LATENCY_MS);
    });
}

/** Fetches all meters. TODO: swap fixture for apiFetch<Meter[]>("/api/meters"). */
export function useMeters() {
  return useSWR<Meter[], Error>("meters", fixtureFetcher(sampleMeters), {
    revalidateOnFocus: false,
  });
}

/** Fetches all invoices. TODO: swap fixture for apiFetch<Invoice[]>("/api/billing"). */
export function useInvoices() {
  return useSWR<Invoice[], Error>("invoices", fixtureFetcher(sampleInvoices), {
    revalidateOnFocus: false,
  });
}

/** Fetches all data streams. TODO: swap fixture for apiFetch<DataStream[]>("/api/streams"). */
export function useStreams() {
  return useSWR<DataStream[], Error>("streams", fixtureFetcher(sampleStreams), {
    revalidateOnFocus: false,
    refreshInterval: 30_000,
  });
}

/** Fetches dashboard aggregates. TODO: swap fixture for apiFetch<DashboardSummary>("/api/dashboard"). */
export function useDashboardSummary() {
  return useSWR<DashboardSummary, Error>(
    "dashboard-summary",
    fixtureFetcher(sampleDashboardSummary),
    { revalidateOnFocus: false }
  );
}

/**
 * Fetches a single meter by id, reusing the meters cache when present.
 */
export function useMeter(id: string | undefined) {
  return useSWR<Meter | undefined, Error>(
    id ? ["meters", id] : null,
    async () => {
      // TODO: swap fixture for apiFetch<Meter>(`/api/meters/${id}`).
      return sampleMeters.find((meter) => meter.id === id);
    },
    { revalidateOnFocus: false }
  );
}
