import { ProdigiError } from "../errors.js";
import type {
  Asset,
  CreateOrderItem,
  CreateOrderRequest,
  Recipient,
  ShippingMethod,
} from "../types/index.js";

/**
 * Fluent builder for constructing order creation requests.
 *
 * @example
 * ```ts
 * const request = new OrderBuilder()
 *   .shippingMethod("Standard")
 *   .recipient({ name: "Jane", address: { ... } })
 *   .addPrint("GLOBAL-PHO-4x6", "https://example.com/photo.jpg")
 *   .build();
 * ```
 */
export class OrderBuilder {
  private _shippingMethod?: ShippingMethod;
  private _recipient?: Recipient;
  private _items: CreateOrderItem[] = [];
  private _merchantReference?: string;
  private _metadata?: Record<string, string>;
  private _idempotencyKey?: string;

  /** Set the shipping method for the order. */
  shippingMethod(method: ShippingMethod): this {
    this._shippingMethod = method;
    return this;
  }

  /** Set the recipient for the order. */
  recipient(recipient: Recipient): this {
    this._recipient = recipient;
    return this;
  }

  /** Set an optional merchant reference for the order. */
  merchantReference(ref: string): this {
    this._merchantReference = ref;
    return this;
  }

  /** Attach custom metadata key-value pairs to the order. */
  metadata(metadata: Record<string, string>): this {
    this._metadata = metadata;
    return this;
  }

  /** Set an idempotency key to prevent duplicate orders. */
  idempotencyKey(key: string): this {
    this._idempotencyKey = key;
    return this;
  }

  /** Add a fully-configured order item. */
  addItem(item: CreateOrderItem): this {
    this._items.push(item);
    return this;
  }

  /**
   * Add a print item with a single image asset.
   * @param sku - Product SKU.
   * @param imageUrl - URL of the image to print.
   * @param options - Optional copies and sizing overrides.
   */
  addPrint(
    sku: string,
    imageUrl: string,
    options?: { copies?: number; sizing?: CreateOrderItem["sizing"] },
  ): this {
    const asset: Asset = { url: imageUrl };
    this._items.push({
      sku,
      copies: options?.copies ?? 1,
      sizing: options?.sizing ?? "fillPrintArea",
      assets: [asset],
    });
    return this;
  }

  /**
   * Build the order creation request.
   * @returns A validated order request payload.
   * @throws {ProdigiError} If shippingMethod, recipient, or items are missing.
   */
  build(): CreateOrderRequest {
    if (!this._shippingMethod) {
      throw new ProdigiError("shippingMethod is required");
    }
    if (!this._recipient) {
      throw new ProdigiError("recipient is required");
    }
    if (this._items.length === 0) {
      throw new ProdigiError("At least one item is required");
    }

    return {
      shippingMethod: this._shippingMethod,
      recipient: this._recipient,
      items: this._items,
      ...(this._merchantReference && {
        merchantReference: this._merchantReference,
      }),
      ...(this._metadata && { metadata: this._metadata }),
      ...(this._idempotencyKey && { idempotencyKey: this._idempotencyKey }),
    };
  }
}
