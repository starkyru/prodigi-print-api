import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpClient } from "../src/http.js";
import { ProdigiApiError } from "../src/errors.js";
import { jsonResponse, textResponse } from "./helpers/mock-response.js";

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
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: "ok" }));

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
    mockFetch.mockResolvedValueOnce(jsonResponse({ outcome: "Created" }));

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
    mockFetch.mockResolvedValueOnce(jsonResponse({ orders: [] }));

    await client.get("/orders", { top: 10, skip: 0 });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("top=10");
    expect(calledUrl).toContain("skip=0");
  });

  it("serializes array query params", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ orders: [] }));

    await client.get("/orders", { orderIds: ["a", "b"] });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("orderIds=a");
    expect(calledUrl).toContain("orderIds=b");
  });

  it("skips undefined query params", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));

    await client.get("/orders", { top: 10, skip: undefined });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("top=10");
    expect(calledUrl).not.toContain("skip");
  });

  it("throws ProdigiApiError on non-2xx", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        { message: "Bad request", errors: ["invalid"] },
        { status: 400 },
      ),
    );

    await expect(client.get("/orders/bad")).rejects.toThrow(ProdigiApiError);
  });

  it("omits X-API-Key header when apiKey is not provided", async () => {
    const noAuthClient = new HttpClient({
      baseUrl: "https://example.com/api",
    });

    mockFetch.mockResolvedValueOnce(jsonResponse({ data: "ok" }));

    await noAuthClient.get("/test");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/api/test",
      expect.objectContaining({
        headers: expect.not.objectContaining({
          "X-API-Key": expect.anything(),
        }),
      }),
    );
  });

  it("ProdigiApiError carries statusCode, traceParent, and data", async () => {
    const errorData = { message: "Not found", errors: [] };

    mockFetch.mockResolvedValueOnce(
      jsonResponse(errorData, {
        status: 404,
        headers: { traceparent: "trace-abc" },
      }),
    );

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

  describe("body parsing", () => {
    it("returns null for an empty body", async () => {
      mockFetch.mockResolvedValueOnce(new Response("", { status: 200 }));

      await expect(client.get("/orders")).resolves.toBe(null);
    });

    it("keeps a non-JSON error body as raw text and falls back to a status message", async () => {
      mockFetch.mockResolvedValueOnce(
        textResponse("<html>502 Bad Gateway</html>", { status: 502 }),
      );

      const noRetry = new HttpClient({
        baseUrl: "https://example.com/api",
        retry: false,
      });

      try {
        await noRetry.get("/test");
        expect.fail("Should have thrown");
      } catch (err) {
        const apiErr = err as ProdigiApiError;
        expect(apiErr).toBeInstanceOf(ProdigiApiError);
        expect(apiErr.statusCode).toBe(502);
        expect(apiErr.message).toBe("API error: 502");
        expect(apiErr.data).toBe("<html>502 Bad Gateway</html>");
      }
    });
  });
});
