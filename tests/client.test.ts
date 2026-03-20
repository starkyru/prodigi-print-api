import { describe, it, expect } from "vitest";
import { ProdigiClient } from "../src/client.js";

describe("ProdigiClient", () => {
  it("defaults to sandbox environment", () => {
    const client = new ProdigiClient({ apiKey: "test-key" });
    expect(client.environment).toBe("sandbox");
  });

  it("can be created with production environment", () => {
    const client = new ProdigiClient({
      apiKey: "test-key",
      environment: "production",
    });
    expect(client.environment).toBe("production");
  });

  it("exposes orders, quotes, products, and catalogue resources", () => {
    const client = new ProdigiClient({ apiKey: "test-key" });
    expect(client.orders).toBeDefined();
    expect(client.quotes).toBeDefined();
    expect(client.products).toBeDefined();
    expect(client.catalogue).toBeDefined();
  });
});
