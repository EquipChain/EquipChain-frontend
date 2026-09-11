import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "./client";

const okResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(okResponse({ hello: "world" }))
    );
    await expect(apiFetch<{ hello: string }>("/api/test")).resolves.toEqual({
      hello: "world",
    });
  });

  it("sends a JSON body with the right content type", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    await apiFetch("/api/test", { method: "POST", body: { a: 1 } });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/test");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
  });

  it("appends defined query params", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse([]));
    vi.stubGlobal("fetch", fetchMock);
    await apiFetch("/api/test", {
      params: { a: "1", b: 2, c: true, d: undefined },
    });
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/test?a=1&b=2&c=true");
  });

  it("throws ApiError with server message on 4xx/5xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        okResponse({ message: "Meter not found" }, 404)
      )
    );
    try {
      await apiFetch("/api/test");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(404);
      expect((error as ApiError).message).toBe("Meter not found");
    }
  });

  it("falls back to a status-derived message when the body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 500 }))
    );
    try {
      await apiFetch("/api/test");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as ApiError).message).toContain("500");
    }
  });

  it("normalizes network failures into ApiError with status 0", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed"))
    );
    try {
      await apiFetch("/api/test");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(0);
    }
  });

  it("normalizes timeouts into ApiError with status 408", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("aborted", "AbortError"))
            );
          })
      )
    );
    const promise = apiFetch("/api/test", { timeoutMs: 10 });
    const assertion = expect(promise).rejects.toMatchObject({ status: 408 });
    await vi.advanceTimersByTimeAsync(20);
    await assertion;
    vi.useRealTimers();
  });

  it("resolves undefined for a 204 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    );
    await expect(apiFetch("/api/test")).resolves.toBeUndefined();
  });
});
