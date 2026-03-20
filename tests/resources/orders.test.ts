import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProdigiClient } from "../../src/client.js";

describe("OrdersResource", () => {
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

  it("create sends POST to /orders", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ outcome: "Created", order: {} }),
    );

    await client.orders.create({
      shippingMethod: "Standard",
      recipient: {
        name: "Jane",
        address: {
          line1: "123 Main St",
          townOrCity: "London",
          postalOrZipCode: "SW1A 1AA",
          countryCode: "GB",
        },
      },
      items: [
        {
          sku: "GLOBAL-PHO-4x6",
          copies: 1,
          assets: [{ url: "https://example.com/photo.jpg" }],
        },
      ],
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/orders"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("get sends GET to /orders/{id}", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ outcome: "Ok", order: { id: "ord_123" } }),
    );

    await client.orders.get("ord_123");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/orders/ord_123");
    expect(mockFetch.mock.calls[0][1].method).toBe("GET");
  });

  it("getActions sends GET to /orders/{id}/actions", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ actions: [] }));

    await client.orders.getActions("ord_123");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/orders/ord_123/actions");
  });

  it("cancel sends POST to /orders/{id}/actions/cancel", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ outcome: "Cancelled" }));

    await client.orders.cancel("ord_123");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/orders/ord_123/actions/cancel");
    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
  });

  it("updateShippingMethod sends POST with body", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ outcome: "Updated" }));

    await client.orders.updateShippingMethod("ord_123", {
      shippingMethod: "Express",
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/orders/ord_123/actions/updateShippingMethod");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.shippingMethod).toBe("Express");
  });

  it("updateRecipient sends POST with body", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ outcome: "Updated" }));

    await client.orders.updateRecipient("ord_123", {
      recipient: {
        name: "John",
        address: {
          line1: "456 Oak Ave",
          townOrCity: "Manchester",
          postalOrZipCode: "M1 1AA",
          countryCode: "GB",
        },
      },
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/orders/ord_123/actions/updateRecipient");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.name).toBe("John");
  });

  it("updateMetadata sends POST with body", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ outcome: "Updated" }));

    await client.orders.updateMetadata("ord_123", {
      metadata: { key: "value" },
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/orders/ord_123/actions/updateMetadata");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.metadata.key).toBe("value");
  });
});
