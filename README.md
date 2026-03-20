# prodigi-print-api

Zero-dependency TypeScript client for the [Prodigi Print API v4.0](https://www.prodigi.com/print-api/).

- ESM + CJS dual format
- Uses `globalThis.fetch` — no runtime dependencies
- Node >= 18

## Installation

```sh
npm install prodigi-print-api
```

## Quick Start

```ts
import { ProdigiClient, OrderBuilder } from "prodigi-print-api";

const client = new ProdigiClient({ apiKey: "your-api-key" });

const order = new OrderBuilder()
  .shippingMethod("Standard")
  .recipient({
    name: "Jane Smith",
    address: {
      line1: "14 Tottenham Court Road",
      townOrCity: "London",
      postalOrZipCode: "W1T 1JY",
      countryCode: "GB",
    },
  })
  .addPrint("GLOBAL-PHO-4x6", "https://example.com/photo.jpg")
  .build();

const { outcome, order: created } = await client.orders.create(order);
console.log(created.id); // ord_...
```

## Environments

The default environment is **sandbox** (`https://api.sandbox.prodigi.com/v4.0`). To use production, set `environment: "production"`:

```ts
const client = new ProdigiClient({
  apiKey: "prod-key",
  environment: "production", // → https://api.prodigi.com/v4.0
});
```

## API Reference

> Full reference with all types: **[API.md](./API.md)**

### Orders

```ts
client.orders.create(request: CreateOrderRequest): Promise<OrderOutcome>
client.orders.get(orderId: string): Promise<OrderOutcome>
client.orders.list(params?: ListOrdersParams): Promise<ListOrdersResponse>
client.orders.getActions(orderId: string): Promise<OrderActions>
client.orders.cancel(orderId: string): Promise<ActionOutcome>
client.orders.updateShippingMethod(orderId: string, request: UpdateShippingMethodRequest): Promise<ActionOutcome>
client.orders.updateRecipient(orderId: string, request: UpdateRecipientRequest): Promise<ActionOutcome>
client.orders.updateMetadata(orderId: string, request: UpdateMetadataRequest): Promise<ActionOutcome>
```

### Quotes

```ts
client.quotes.create(request: CreateQuoteRequest): Promise<QuoteOutcome>
```

### Products

```ts
client.products.get(sku: string): Promise<ProductOutcome>
client.products.getSpine(request: SpineRequest): Promise<SpineResponse>
```

## OrderBuilder

Fluent builder for constructing `CreateOrderRequest` objects:

```ts
new OrderBuilder()
  .shippingMethod(method: ShippingMethod)   // required — "Budget" | "Standard" | "Express" | "Overnight"
  .recipient(recipient: Recipient)          // required
  .addItem(item: CreateOrderItem)           // add a fully specified item
  .addPrint(sku, imageUrl, options?)        // shorthand — options: { copies?, sizing? }
  .merchantReference(ref: string)
  .metadata(metadata: Record<string, string>)
  .idempotencyKey(key: string)
  .build()                                  // validates and returns CreateOrderRequest
```

`build()` throws if `shippingMethod`, `recipient`, or at least one item is missing.

## Error Handling

API errors are thrown as `ProdigiApiError`:

```ts
import { ProdigiApiError } from "prodigi-print-api";

try {
  await client.orders.get("ord_invalid");
} catch (err) {
  if (err instanceof ProdigiApiError) {
    console.log(err.statusCode); // HTTP status code
    console.log(err.traceParent); // trace ID for Prodigi support
    console.log(err.data); // raw error body
  }
}
```

## Types

All types are exported from the package root:

```ts
import type {
  // Common
  ShippingMethod, // "Budget" | "Standard" | "Express" | "Overnight"
  Sizing, // "fillPrintArea" | "fitPrintArea" | "stretchToPrintArea"
  Address,
  Recipient,
  Cost,

  // Orders
  CreateOrderRequest,
  CreateOrderItem,
  Order,
  OrderOutcome,
  ListOrdersParams,
  ListOrdersResponse,
  OrderActions,
  ActionOutcome,
  UpdateShippingMethodRequest,
  UpdateRecipientRequest,
  UpdateMetadataRequest,

  // Quotes
  CreateQuoteRequest,
  Quote,
  QuoteOutcome,

  // Products
  Product,
  ProductOutcome,
  SpineRequest,
  SpineResponse,

  // Client
  ProdigiClientOptions,
  Environment,
} from "prodigi-print-api";
```

## Development

```sh
npm test          # run tests (vitest)
npm run build     # build ESM + CJS (tsup)
npm run typecheck  # tsc --noEmit
```

## CI/CD

Pushing to `main` or `test` triggers the GitHub Actions publish workflow (`.github/workflows/publish.yml`):

1. Runs lint, typecheck, and tests
2. Bumps the **patch** version automatically
3. On the `test` branch, appends a `-test` prerelease suffix
4. Commits, tags, and pushes the version bump
5. Publishes to npm with provenance (the `test` branch publishes under the `test` dist-tag)

**Required secret:** `NPM_TOKEN` — an npm access token with publish permissions.

## License

MIT
