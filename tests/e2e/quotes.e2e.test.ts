import { describe, it, expect, beforeAll } from "vitest";
import { ProdigiClient } from "../../src/client.js";

describe("Quotes E2E", () => {
  let client: ProdigiClient;

  beforeAll(() => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY env variable is required");
    client = new ProdigiClient({ apiKey, environment: "sandbox" });
  });

  it("creates a quote", async () => {
    const result = await client.quotes.create({
      destinationCountryCode: "GB",
      items: [
        {
          sku: "GLOBAL-PHO-4x6",
          copies: 1,
          attributes: { finish: "lustre" },
          assets: [{ printArea: "default" }],
        },
      ],
    });

    expect(result.outcome).toMatch(/Ok|Created/);
    expect(result.quotes).toBeInstanceOf(Array);
    expect(result.quotes.length).toBeGreaterThan(0);

    const quote = result.quotes[0];
    expect(quote.costSummary).toBeDefined();
    expect(quote.costSummary.items).toBeDefined();
    expect(quote.costSummary.shipping).toBeDefined();
  });
});
