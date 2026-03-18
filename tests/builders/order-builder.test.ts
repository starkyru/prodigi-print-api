import { describe, it, expect } from "vitest";
import { OrderBuilder } from "../../src/builders/order-builder.js";
import { ProdigiError } from "../../src/errors.js";

describe("OrderBuilder", () => {
  const validRecipient = {
    name: "Jane",
    address: {
      line1: "123 Main St",
      townOrCity: "London",
      postalOrZipCode: "SW1A 1AA",
      countryCode: "GB",
    },
  };

  it("builds a valid order with chaining", () => {
    const order = new OrderBuilder()
      .shippingMethod("Standard")
      .recipient(validRecipient)
      .addPrint("GLOBAL-PHO-4x6", "https://example.com/photo.jpg")
      .build();

    expect(order.shippingMethod).toBe("Standard");
    expect(order.recipient.name).toBe("Jane");
    expect(order.items).toHaveLength(1);
    expect(order.items[0].sku).toBe("GLOBAL-PHO-4x6");
    expect(order.items[0].copies).toBe(1);
    expect(order.items[0].assets[0].url).toBe("https://example.com/photo.jpg");
  });

  it("addPrint accepts options", () => {
    const order = new OrderBuilder()
      .shippingMethod("Express")
      .recipient(validRecipient)
      .addPrint("GLOBAL-PHO-4x6", "https://example.com/photo.jpg", {
        copies: 3,
        sizing: "fillPrintArea",
      })
      .build();

    expect(order.items[0].copies).toBe(3);
    expect(order.items[0].sizing).toBe("fillPrintArea");
  });

  it("addItem adds a full item", () => {
    const order = new OrderBuilder()
      .shippingMethod("Standard")
      .recipient(validRecipient)
      .addItem({
        sku: "GLOBAL-CAN-16x20",
        copies: 1,
        assets: [{ url: "https://example.com/art.jpg", printArea: "default" }],
        attributes: { wrap: "MirrorWrap" },
      })
      .build();

    expect(order.items[0].attributes).toEqual({ wrap: "MirrorWrap" });
  });

  it("includes optional fields when set", () => {
    const order = new OrderBuilder()
      .shippingMethod("Standard")
      .recipient(validRecipient)
      .addPrint("GLOBAL-PHO-4x6", "https://example.com/photo.jpg")
      .merchantReference("my-ref-123")
      .metadata({ campaign: "summer" })
      .idempotencyKey("idem-key")
      .build();

    expect(order.merchantReference).toBe("my-ref-123");
    expect(order.metadata).toEqual({ campaign: "summer" });
    expect(order.idempotencyKey).toBe("idem-key");
  });

  it("throws if shippingMethod is missing", () => {
    expect(() =>
      new OrderBuilder()
        .recipient(validRecipient)
        .addPrint("GLOBAL-PHO-4x6", "https://example.com/photo.jpg")
        .build(),
    ).toThrow(ProdigiError);
  });

  it("throws if recipient is missing", () => {
    expect(() =>
      new OrderBuilder()
        .shippingMethod("Standard")
        .addPrint("GLOBAL-PHO-4x6", "https://example.com/photo.jpg")
        .build(),
    ).toThrow(ProdigiError);
  });

  it("throws if no items are added", () => {
    expect(() =>
      new OrderBuilder()
        .shippingMethod("Standard")
        .recipient(validRecipient)
        .build(),
    ).toThrow(ProdigiError);
  });
});
