import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpClient } from "../src/http.js";
import { ProdigiApiError } from "../src/errors.js";
import { jsonResponse } from "./helpers/mock-response.js";

describe("HttpClient retry", () => {
  const originalFetch = globalThis.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  /** Jitter off so every delay below is the exact exponential value. */
  const retrying = new HttpClient({
    baseUrl: "https://api.sandbox.prodigi.com/v4.0",
    apiKey: "test-key",
    retry: { jitter: false },
  });

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("retries a 503 and resolves with the eventual success", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ message: "down" }, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ outcome: "Ok" }));

    const promise = retrying.get("/orders");
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(promise).resolves.toEqual({ outcome: "Ok" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("retries a 429 and resolves with the eventual success", async () => {
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({ message: "slow down" }, { status: 429 }),
      )
      .mockResolvedValueOnce(jsonResponse({ outcome: "Ok" }));

    const promise = retrying.get("/orders");
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(promise).resolves.toEqual({ outcome: "Ok" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("stops at maxAttempts and throws the last error", async () => {
    // A fresh Response per call — a body can only be read once.
    mockFetch.mockImplementation(() =>
      jsonResponse({ message: "still down" }, { status: 503 }),
    );

    const promise = retrying.get("/orders");
    const assertion = expect(promise).rejects.toMatchObject({
      statusCode: 503,
      message: "still down",
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;

    // default maxAttempts is 3 → 1 initial + 2 retries
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("backs off 500ms then 1000ms between attempts", async () => {
    // A fresh Response per call — a body can only be read once.
    mockFetch.mockImplementation(() =>
      jsonResponse({ message: "down" }, { status: 503 }),
    );

    const promise = retrying.get("/orders");
    const assertion = expect(promise).rejects.toThrow(ProdigiApiError);

    await vi.advanceTimersByTimeAsync(499);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(999);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    expect(mockFetch).toHaveBeenCalledTimes(3);

    await assertion;
  });

  it("waits the Retry-After delay instead of the backoff delay", async () => {
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse(
          { message: "slow down" },
          { status: 429, headers: { "retry-after": "2" } },
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ outcome: "Ok" }));

    const promise = retrying.get("/orders");

    // Backoff alone would have fired at 500ms.
    await vi.advanceTimersByTimeAsync(1_999);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    await expect(promise).resolves.toEqual({ outcome: "Ok" });
  });

  it("gives up rather than stalling on a Retry-After beyond maxRetryAfterMs", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        { message: "slow down" },
        { status: 429, headers: { "retry-after": "3600" } },
      ),
    );

    await expect(retrying.get("/orders")).rejects.toMatchObject({
      statusCode: 429,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry a 400", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ message: "Bad request" }, { status: 400 }),
    );

    await expect(retrying.get("/orders")).rejects.toThrow(ProdigiApiError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry a 501", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ message: "Not implemented" }, { status: 501 }),
    );

    await expect(retrying.get("/orders")).rejects.toThrow(ProdigiApiError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry a POST by default", async () => {
    // A fresh Response per call — a body can only be read once.
    mockFetch.mockImplementation(() =>
      jsonResponse({ message: "down" }, { status: 503 }),
    );

    await expect(retrying.post("/orders", { foo: "bar" })).rejects.toThrow(
      ProdigiApiError,
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("retries a POST marked idempotent", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ message: "down" }, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ outcome: "Created" }));

    const promise = retrying.post(
      "/orders",
      { foo: "bar" },
      {
        idempotent: true,
      },
    );
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(promise).resolves.toEqual({ outcome: "Created" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("retries when fetch itself rejects", async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse({ outcome: "Ok" }));

    const promise = retrying.get("/orders");
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(promise).resolves.toEqual({ outcome: "Ok" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("rethrows the original network error once attempts run out", async () => {
    mockFetch.mockRejectedValue(new TypeError("fetch failed"));

    const promise = retrying.get("/orders");
    const assertion = expect(promise).rejects.toThrow("fetch failed");
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("makes a single attempt when retry is disabled", async () => {
    const noRetry = new HttpClient({
      baseUrl: "https://api.sandbox.prodigi.com/v4.0",
      apiKey: "test-key",
      retry: false,
    });

    // A fresh Response per call — a body can only be read once.
    mockFetch.mockImplementation(() =>
      jsonResponse({ message: "down" }, { status: 503 }),
    );

    await expect(noRetry.get("/orders")).rejects.toThrow(ProdigiApiError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("honours a custom maxAttempts", async () => {
    const patient = new HttpClient({
      baseUrl: "https://api.sandbox.prodigi.com/v4.0",
      apiKey: "test-key",
      retry: { maxAttempts: 5, jitter: false },
    });

    // A fresh Response per call — a body can only be read once.
    mockFetch.mockImplementation(() =>
      jsonResponse({ message: "down" }, { status: 503 }),
    );

    const promise = patient.get("/orders");
    const assertion = expect(promise).rejects.toThrow(ProdigiApiError);
    await vi.advanceTimersByTimeAsync(60_000);
    await assertion;

    expect(mockFetch).toHaveBeenCalledTimes(5);
  });
});
