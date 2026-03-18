import { ProdigiError } from "../errors.js";
import type {
  Asset,
  CreateOrderItem,
  CreateOrderRequest,
  Recipient,
  ShippingMethod,
} from "../types/index.js";

export class OrderBuilder {
  private _shippingMethod?: ShippingMethod;
  private _recipient?: Recipient;
  private _items: CreateOrderItem[] = [];
  private _merchantReference?: string;
  private _metadata?: Record<string, string>;
  private _idempotencyKey?: string;

  shippingMethod(method: ShippingMethod): this {
    this._shippingMethod = method;
    return this;
  }

  recipient(recipient: Recipient): this {
    this._recipient = recipient;
    return this;
  }

  merchantReference(ref: string): this {
    this._merchantReference = ref;
    return this;
  }

  metadata(metadata: Record<string, string>): this {
    this._metadata = metadata;
    return this;
  }

  idempotencyKey(key: string): this {
    this._idempotencyKey = key;
    return this;
  }

  addItem(item: CreateOrderItem): this {
    this._items.push(item);
    return this;
  }

  addPrint(
    sku: string,
    imageUrl: string,
    options?: { copies?: number; sizing?: CreateOrderItem["sizing"] },
  ): this {
    const asset: Asset = { url: imageUrl };
    this._items.push({
      sku,
      copies: options?.copies ?? 1,
      sizing: options?.sizing,
      assets: [asset],
    });
    return this;
  }

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
