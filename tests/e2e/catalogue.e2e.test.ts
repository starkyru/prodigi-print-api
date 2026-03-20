import { describe, it, expect, beforeAll } from "vitest";
import { ProdigiClient } from "../../src/client.js";

describe("Catalogue E2E", () => {
  let client: ProdigiClient;

  beforeAll(() => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY env variable is required");
    client = new ProdigiClient({ apiKey, environment: "sandbox" });
  });

  it("lists the catalogue categories", async () => {
    const result = await client.catalogue.list();

    expect(result).toBeDefined();
    expect(typeof result).toBe("object");

    const categories = Object.keys(result);
    expect(categories.length).toBeGreaterThan(0);

    const firstCategory = result[categories[0]];
    expect(firstCategory.name).toBeTypeOf("string");
    expect(firstCategory.slug).toBeTypeOf("string");
  });

  it("gets product detail by slug", async () => {
    // First get a slug from the catalogue list
    const catalogue = await client.catalogue.list();
    const categories = Object.values(catalogue);

    // Find the first category that has products
    let productSlug: string | undefined;
    for (const category of categories) {
      const products = Object.values(category.products ?? {});
      if (products.length > 0) {
        productSlug = products[0].productSlug;
        break;
      }
      // Check subcategories too
      for (const sub of Object.values(category.subCategories ?? {})) {
        const subProducts = Object.values(sub.products ?? {});
        if (subProducts.length > 0) {
          productSlug = subProducts[0].productSlug;
          break;
        }
      }
      if (productSlug) break;
    }

    expect(productSlug).toBeDefined();

    const detail = await client.catalogue.get(productSlug!);
    expect(detail.name).toBeTypeOf("string");
    expect(detail.variants).toBeDefined();
    expect(detail.variants.rows).toBeInstanceOf(Array);
  });
});
