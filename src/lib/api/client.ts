// ============================================================================
// API Client — typed fetch wrapper shared by SWR and mutations
// ============================================================================
// The app has no data-fetching layer at all: pages import hard-coded fixture
// literals directly. When the backend lands, every component would need its
// own fetch/abort/error handling. This module gives the app one fetch
// wrapper (JSON parsing, timeouts, typed errors) that the SWR hooks and the
// offline queue both sit on.

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const DEFAULT_TIMEOUT_MS = 10_000;

/** Appends undefined-filtered params to a base URL path. */
function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * Performs a JSON request against the app's API routes and parses the body.
 * Network failures, timeouts, and non-2xx statuses all normalize to ApiError
 * so callers handle one error shape.
 *
 * @throws {ApiError} on non-2xx status or network failure
 */
export async function apiFetch<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
    timeoutMs?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const { method = "GET", body, params, timeoutMs = DEFAULT_TIMEOUT_MS, headers } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      signal: controller.signal,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    // Abort produces a generic DOMException; surface a consistent message.
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    throw new ApiError(
      isTimeout ? "Request timed out. Please try again." : "Network request failed. Check your connection.",
      isTimeout ? 408 : 0,
      error
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let payload: unknown = null;
    let message = `Request failed with status ${response.status}`;
    try {
      payload = await response.json();
      const maybeMessage = (payload as { message?: string; error?: string })?.message ??
        (payload as { error?: string })?.error;
      if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
        message = maybeMessage;
      }
    } catch {
      // Body was not JSON; keep the status-derived message.
    }
    throw new ApiError(message, response.status, payload);
  }

  if (response.status === 204) return undefined as T;

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("Server returned an invalid response.", response.status);
  }
}
