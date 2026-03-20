import { describe, it, expect, beforeAll } from "vitest";
import { ProdigiClient } from "../../src/client.js";

describe("Products E2E", () => {
  let client: ProdigiClient;

  beforeAll(() => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY env variable is required");
    client = new ProdigiClient({ apiKey, environment: "sandbox" });
  });

  it("gets a product by SKU", async () => {
    const result = await client.products.get("GLOBAL-PHO-4x6");

    expect(result.outcome).toBe("Ok");
    expect(result.product).toBeDefined();
    expect(result.product.sku).toBe("GLOBAL-PHO-4x6");
    expect(result.product.variants).toBeInstanceOf(Array);
  });

  it("calculates spine width for a book product", async () => {
    const result = await client.products.getSpine({
      sku: "BOOK-FE-11_7-SQ-HARD-G",
      destinationCountryCode: "GB",
      numberOfPages: 100,
    });

    expect(result.success).toBe(true);
    expect(result.spineInfo).toBeDefined();
    expect(result.spineInfo.widthMm).toBeTypeOf("number");
    expect(result.spineInfo.widthMm).toBeGreaterThan(0);
  });
});
