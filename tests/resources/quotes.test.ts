import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProdigiClient } from "../../src/client.js";

describe("QuotesResource", () => {
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

  it("create sends POST to /quotes", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ outcome: "Ok", quotes: [] }),
      headers: new Headers(),
    });

    await client.quotes.create({
      shippingMethod: "Standard",
      destinationCountryCode: "GB",
      items: [
        {
          sku: "GLOBAL-PHO-4x6",
          copies: 1,
          assets: [{ printArea: "default" }],
        },
      ],
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/quotes");
    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.destinationCountryCode).toBe("GB");
  });
});
