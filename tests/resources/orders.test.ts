import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProdigiClient } from "../../src/client.js";
import { jsonResponse } from "../helpers/mock-response.js";

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

  /** URL of the nth fetch call, parsed. */
  const calledUrl = (index = 0): URL =>
    new URL(mockFetch.mock.calls[index][0] as string);

  it("create sends POST to /orders", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ outcome: "Created", order: {} }),
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
          sizing: "fillPrintArea",
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
      jsonResponse({ outcome: "Ok", order: { id: "ord_123" } }),
    );

    await client.orders.get("ord_123");

    expect(calledUrl().pathname).toBe("/v4.0/orders/ord_123");
    expect(mockFetch.mock.calls[0][1].method).toBe("GET");
  });

  it("getActions sends GET to /orders/{id}/actions", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ actions: [] }));

    await client.orders.getActions("ord_123");

    expect(calledUrl().pathname).toBe("/v4.0/orders/ord_123/actions");
  });

  it("cancel sends POST to /orders/{id}/actions/cancel", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ outcome: "Cancelled" }));

    await client.orders.cancel("ord_123");

    expect(calledUrl().pathname).toBe("/v4.0/orders/ord_123/actions/cancel");
    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
  });

  it("updateShippingMethod sends POST with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ outcome: "Updated" }));

    await client.orders.updateShippingMethod("ord_123", {
      shippingMethod: "Express",
    });

    expect(calledUrl().pathname).toBe(
      "/v4.0/orders/ord_123/actions/updateShippingMethod",
    );
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.shippingMethod).toBe("Express");
  });

  it("updateRecipient sends POST with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ outcome: "Updated" }));

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

    expect(calledUrl().pathname).toBe(
      "/v4.0/orders/ord_123/actions/updateRecipient",
    );
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.name).toBe("John");
  });

  it("updateMetadata sends POST with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ outcome: "Updated" }));

    await client.orders.updateMetadata("ord_123", {
      metadata: { key: "value" },
    });

    expect(calledUrl().pathname).toBe(
      "/v4.0/orders/ord_123/actions/updateMetadata",
    );
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.metadata.key).toBe("value");
  });

  describe("list", () => {
    it("sends GET to /orders with no query string when given no params", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ outcome: "Ok", orders: [], hasMore: false }),
      );

      await client.orders.list();

      expect(calledUrl().pathname).toBe("/v4.0/orders");
      expect(calledUrl().search).toBe("");
      expect(mockFetch.mock.calls[0][1].method).toBe("GET");
    });

    it("sends every documented filter under its Prodigi parameter name", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ outcome: "Ok", orders: [], hasMore: false }),
      );

      await client.orders.list({
        top: 25,
        skip: 50,
        createdFrom: "2024-01-01T00:00:00Z",
        createdTo: "2024-02-01T00:00:00Z",
        status: "inProgress",
        orderIds: ["ord_1", "ord_2"],
        merchantReferences: ["ref-a", "ref-b"],
      });

      const params = calledUrl().searchParams;
      expect(params.get("top")).toBe("25");
      expect(params.get("skip")).toBe("50");
      expect(params.get("createdFrom")).toBe("2024-01-01T00:00:00Z");
      expect(params.get("createdTo")).toBe("2024-02-01T00:00:00Z");
      expect(params.get("status")).toBe("inProgress");
      expect(params.getAll("orderIds")).toEqual(["ord_1", "ord_2"]);
      expect(params.getAll("merchantReferences")).toEqual(["ref-a", "ref-b"]);
    });

    it("uses the plural merchantReferences, not merchantReference", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ outcome: "Ok", orders: [], hasMore: false }),
      );

      await client.orders.list({ merchantReferences: ["ref-a"] });

      const params = calledUrl().searchParams;
      expect(params.has("merchantReference")).toBe(false);
      expect(params.getAll("merchantReferences")).toEqual(["ref-a"]);
    });

    it("serializes a Date filter to ISO 8601", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ outcome: "Ok", orders: [], hasMore: false }),
      );

      await client.orders.list({
        createdFrom: new Date("2024-01-15T10:30:00Z"),
      });

      expect(calledUrl().searchParams.get("createdFrom")).toBe(
        "2024-01-15T10:30:00.000Z",
      );
    });

    it("omits filters that were not supplied", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ outcome: "Ok", orders: [], hasMore: false }),
      );

      await client.orders.list({ top: 10 });

      const params = calledUrl().searchParams;
      expect(params.get("top")).toBe("10");
      expect(params.has("skip")).toBe(false);
      expect(params.has("status")).toBe(false);
      expect(params.has("createdFrom")).toBe(false);
      expect(params.has("createdTo")).toBe(false);
      expect(params.has("orderIds")).toBe(false);
      expect(params.has("merchantReferences")).toBe(false);
    });

    it("returns the paginated response body", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          outcome: "Ok",
          orders: [{ id: "ord_1" }, { id: "ord_2" }],
          hasMore: true,
          nextUrl: "https://api.sandbox.prodigi.com/v4.0/orders?top=2&skip=2",
          traceParent: "00-trace-01",
        }),
      );

      const result = await client.orders.list({ top: 2 });

      expect(result.outcome).toBe("Ok");
      expect(result.orders).toEqual([{ id: "ord_1" }, { id: "ord_2" }]);
      expect(result.hasMore).toBe(true);
      expect(result.nextUrl).toBe(
        "https://api.sandbox.prodigi.com/v4.0/orders?top=2&skip=2",
      );
      expect(result.traceParent).toBe("00-trace-01");
    });
  });

  describe("create retry safety", () => {
    const request = {
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
          sizing: "fillPrintArea" as const,
          assets: [{ url: "https://example.com/photo.jpg" }],
        },
      ],
    };

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("does not replay a create without an idempotency key", async () => {
      // A fresh Response per call — a body can only be read once.
      mockFetch.mockImplementation(() =>
        jsonResponse({ message: "down" }, { status: 503 }),
      );

      await expect(client.orders.create(request)).rejects.toMatchObject({
        statusCode: 503,
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("replays a create that carries an idempotency key", async () => {
      mockFetch
        .mockResolvedValueOnce(
          jsonResponse({ message: "down" }, { status: 503 }),
        )
        .mockResolvedValueOnce(
          jsonResponse({ outcome: "Created", order: { id: "ord_1" } }),
        );

      const promise = client.orders.create({
        ...request,
        idempotencyKey: "key-123",
      });
      await vi.advanceTimersByTimeAsync(10_000);

      await expect(promise).resolves.toMatchObject({ outcome: "Created" });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
