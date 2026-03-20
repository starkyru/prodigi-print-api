import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProdigiClient } from "../../src/client.js";

describe("ProductsResource", () => {
  const originalFetch = globalThis.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: ProdigiClient;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    client = new ProdigiClient({ apiKey: "test-key" });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const mockResponse = (data: unknown) => ({
    ok: true,
    json: () => Promise.resolve(data),
    headers: new Headers(),
  });

  it("get sends GET to /products/{sku}", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ outcome: "Ok", product: { sku: "GLOBAL-PHO-4x6" } }),
    );

    await client.products.get("GLOBAL-PHO-4x6");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/products/GLOBAL-PHO-4x6");
    expect(mockFetch.mock.calls[0][1].method).toBe("GET");
  });

  it("list sends GET to /products with query params", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        products: [{ sku: "GLOBAL-PHO-4x6" }],
        hasMore: false,
        traceParent: "test-trace",
      }),
    );

    await client.products.list({ sku: "GLOBAL-PHO", top: 10, skip: 0 });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/products");
    expect(calledUrl).toContain("sku=GLOBAL-PHO");
    expect(calledUrl).toContain("top=10");
    expect(calledUrl).toContain("skip=0");
    expect(mockFetch.mock.calls[0][1].method).toBe("GET");
  });

  it("getSpine sends POST to /products/spine", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        success: true,
        message: "Ok",
        spineInfo: { widthMm: 12.5 },
      }),
    );

    await client.products.getSpine({
      sku: "GLOBAL-PHB-A4-HRD",
      numberOfPages: 100,
      destinationCountryCode: "US",
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/products/spine");
    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.sku).toBe("GLOBAL-PHB-A4-HRD");
    expect(body.numberOfPages).toBe(100);
  });
});
