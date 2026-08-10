import { describe, it, expect, beforeAll } from "vitest";
import { ProdigiClient } from "../../src/client.js";

/** Stable reference so the merchantReferences filter has something to match. */
const MERCHANT_REFERENCE = "prodigi-sdk-e2e";

describe("Orders E2E", () => {
  let client: ProdigiClient;
  let orderId: string;

  beforeAll(() => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY env variable is required");
    client = new ProdigiClient({ apiKey, environment: "sandbox" });
  });

  it("creates an order", async () => {
    const result = await client.orders.create({
      merchantReference: MERCHANT_REFERENCE,
      shippingMethod: "Budget",
      recipient: {
        name: "E2E Test",
        address: {
          line1: "123 Test St",
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
          attributes: { finish: "lustre" },
          assets: [
            {
              printArea: "default",
              url: "https://picsum.photos/seed/prodigi-e2e/800/600",
            },
          ],
        },
      ],
    });

    expect(result.outcome).toMatch(/Created|CreatedWithIssues/);
    expect(result.order).toBeDefined();
    expect(result.order.id).toBeTypeOf("string");
    orderId = result.order.id;
  });

  it("fetches the created order", async () => {
    const result = await client.orders.get(orderId);

    expect(result.outcome).toBe("Ok");
    expect(result.order.id).toBe(orderId);
    expect(result.order.recipient.name).toBe("E2E Test");
  });

  it("lists orders with the documented pagination shape", async () => {
    const result = await client.orders.list({ top: 2 });

    expect(result.outcome).toBe("Ok");
    expect(Array.isArray(result.orders)).toBe(true);
    expect(result.orders.length).toBeLessThanOrEqual(2);
    expect(typeof result.hasMore).toBe("boolean");
    if (result.hasMore) {
      expect(result.nextUrl).toBeTypeOf("string");
    }
  });

  it("filters by orderIds", async () => {
    const result = await client.orders.list({ orderIds: [orderId] });

    expect(result.orders.map((order) => order.id)).toContain(orderId);
  });

  it("filters by merchantReferences", async () => {
    const result = await client.orders.list({
      merchantReferences: [MERCHANT_REFERENCE],
      top: 5,
    });

    expect(result.orders.length).toBeGreaterThan(0);
    // A silently-ignored filter would return unrelated orders.
    for (const order of result.orders) {
      expect(order.merchantReference).toBe(MERCHANT_REFERENCE);
    }
  });

  it("filters by createdFrom", async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await client.orders.list({
      createdFrom: yesterday,
      top: 5,
    });

    for (const order of result.orders) {
      expect(Date.parse(order.created)).toBeGreaterThanOrEqual(
        yesterday.getTime(),
      );
    }
  });

  it("gets available actions", async () => {
    const result = await client.orders.getActions(orderId);

    expect(result.outcome).toBe("Ok");
    expect(result.cancel).toBeDefined();
    expect(result.changeShippingMethod).toBeDefined();
    expect(result.changeRecipientDetails).toBeDefined();
    expect(result.changeMetaData).toBeDefined();
  });

  it("updates shipping method", async () => {
    const result = await client.orders.updateShippingMethod(orderId, {
      shippingMethod: "Standard",
    });

    expect(result.outcome).toBeDefined();
    expect(result.order.id).toBe(orderId);
  });

  it("updates recipient", async () => {
    const result = await client.orders.updateRecipient(orderId, {
      recipient: {
        name: "Updated E2E",
        address: {
          line1: "456 Updated St",
          townOrCity: "Manchester",
          postalOrZipCode: "M1 1AA",
          countryCode: "GB",
        },
      },
    });

    expect(result.outcome).toBeDefined();
    expect(result.order.id).toBe(orderId);
    expect(result.order.recipient.name).toBe("Updated E2E");
  });

  it("updates metadata", async () => {
    const result = await client.orders.updateMetadata(orderId, {
      metadata: { testKey: "testValue" },
    });

    expect(result.outcome).toBeDefined();
    expect(result.order.id).toBe(orderId);
  });

  it("cancels the order", async () => {
    const result = await client.orders.cancel(orderId);

    expect(result.outcome).toBeDefined();
    expect(result.order.id).toBe(orderId);
  });
});
