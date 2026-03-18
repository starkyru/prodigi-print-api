import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpClient } from "../src/http.js";
import { ProdigiApiError } from "../src/errors.js";

describe("HttpClient", () => {
  const originalFetch = globalThis.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const client = new HttpClient({
    baseUrl: "https://api.sandbox.prodigi.com/v4.0",
    apiKey: "test-key",
  });

  it("sends X-API-Key header on GET", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: "ok" }),
      headers: new Headers(),
    });

    await client.get("/orders");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.sandbox.prodigi.com/v4.0/orders",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ "X-API-Key": "test-key" }),
      }),
    );
  });

  it("sends JSON body on POST", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ outcome: "Created" }),
      headers: new Headers(),
    });

    await client.post("/orders", { foo: "bar" });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.sandbox.prodigi.com/v4.0/orders",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ foo: "bar" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("serializes query params", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ orders: [] }),
      headers: new Headers(),
    });

    await client.get("/orders", { top: 10, skip: 0 });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("top=10");
    expect(calledUrl).toContain("skip=0");
  });

  it("serializes array query params", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ orders: [] }),
      headers: new Headers(),
    });

    await client.get("/orders", { orderIds: ["a", "b"] });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("orderIds=a");
    expect(calledUrl).toContain("orderIds=b");
  });

  it("skips undefined query params", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
      headers: new Headers(),
    });

    await client.get("/orders", { top: 10, skip: undefined });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("top=10");
    expect(calledUrl).not.toContain("skip");
  });

  it("throws ProdigiApiError on non-2xx", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({ message: "Bad request", errors: ["invalid"] }),
      headers: new Headers({ traceparent: "trace-123" }),
    });

    await expect(client.get("/orders/bad")).rejects.toThrow(ProdigiApiError);
  });

  it("ProdigiApiError carries statusCode, traceParent, and data", async () => {
    const errorData = { message: "Not found", errors: [] };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve(errorData),
      headers: new Headers({ traceparent: "trace-abc" }),
    });

    try {
      await client.get("/orders/missing");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ProdigiApiError);
      const apiErr = err as ProdigiApiError;
      expect(apiErr.statusCode).toBe(404);
      expect(apiErr.traceParent).toBe("trace-abc");
      expect(apiErr.data).toEqual(errorData);
      expect(apiErr.message).toBe("Not found");
    }
  });
});
