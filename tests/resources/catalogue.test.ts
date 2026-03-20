import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProdigiClient } from "../../src/client.js";

describe("CatalogueResource", () => {
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

  it("list sends GET to /catalogue with no X-API-Key header", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ "fine-art-prints": { name: "Fine Art Prints" } }),
    );

    await client.catalogue.list();

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/catalogue");
    expect(calledUrl).toContain(
      "product-api-app-live.azurewebsites.net/api/catalogue",
    );
    expect(mockFetch.mock.calls[0][1].method).toBe("GET");
    expect(mockFetch.mock.calls[0][1].headers).not.toHaveProperty("X-API-Key");
  });

  it("get sends GET to /catalogue/{slug} with no X-API-Key header", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ name: "Cold Press Watercolour Paper", variants: {} }),
    );

    await client.catalogue.get("cold-press-watercolour-paper");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/catalogue/cold-press-watercolour-paper");
    expect(mockFetch.mock.calls[0][1].method).toBe("GET");
    expect(mockFetch.mock.calls[0][1].headers).not.toHaveProperty("X-API-Key");
  });
});
