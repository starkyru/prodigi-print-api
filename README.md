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

## Retries & rate limiting

Transient failures are retried automatically with exponential backoff and jitter. The defaults are 3 attempts, starting at 500 ms and doubling, capped at 8 s:

```ts
const client = new ProdigiClient({
  apiKey: "your-api-key",
  retry: {
    maxAttempts: 5, // total attempts including the first (default 3)
    initialDelayMs: 500, // base delay for the first retry (default 500)
    maxDelayMs: 8_000, // cap on the computed delay (default 8000)
    maxRetryAfterMs: 30_000, // longest Retry-After honoured (default 30000)
    jitter: true, // spread retries out (default true)
    retryNetworkErrors: true, // retry when fetch itself rejects (default true)
  },
});

// Opt out entirely:
const noRetry = new ProdigiClient({ apiKey: "your-api-key", retry: false });
```

**What is retried**

| Condition                     | Retried?                                   |
| ----------------------------- | ------------------------------------------ |
| `429 Too Many Requests`       | Yes                                        |
| `5xx` (except `501`)          | Yes                                        |
| `fetch` rejects (network/DNS) | Yes, unless `retryNetworkErrors: false`    |
| `4xx` other than `429`        | No — replaying will not change the outcome |
| `501 Not Implemented`         | No — permanent                             |

**`Retry-After` is honoured** when present, in both the delta-seconds and HTTP-date forms, and takes precedence over the computed backoff. If the server asks for longer than `maxRetryAfterMs`, the client throws instead of stalling — better to surface the error than to block a request for minutes.

**POSTs are not retried by default.** Replaying a POST can duplicate a side effect, so only `GET` is retried automatically. The one exception is `orders.create()`, which becomes retryable when you set `idempotencyKey` on the request — Prodigi then de-duplicates the replay:

```ts
// Retried on 429/5xx, because the idempotency key makes a replay safe.
await client.orders.create({ ...order, idempotencyKey: crypto.randomUUID() });

// Not retried — a replay could create a second order.
await client.orders.create(order);
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
client.orders.updateShippingMethod(orderId: string, request: UpdateShippingMethodRequest): Promise<ShippingActionOutcome>
client.orders.updateRecipient(orderId: string, request: UpdateRecipientRequest): Promise<RecipientActionOutcome>
client.orders.updateMetadata(orderId: string, request: UpdateMetadataRequest): Promise<ActionOutcome>
```

#### Listing orders

`list()` maps to `GET /orders`. All filters are optional and omitted filters are not sent:

```ts
const page = await client.orders.list({
  top: 25, // 1–100, server default 10
  skip: 0, // server default 0
  createdFrom: new Date("2024-01-01"), // Date or ISO 8601 string
  createdTo: "2024-02-01T00:00:00Z",
  status: "inProgress", // draft | awaitingPayment | inProgress | complete | cancelled
  orderIds: ["ord_1", "ord_2"],
  merchantReferences: ["ref-a", "ref-b"], // note: plural, and an array
});

page.orders; // Order[]
page.hasMore; // true when further pages exist
page.nextUrl; // absolute URL of the next page, when hasMore
```

Paginate by advancing `skip`:

```ts
for (let skip = 0; ; skip += 100) {
  const page = await client.orders.list({ top: 100, skip });
  for (const order of page.orders) console.log(order.id);
  if (!page.hasMore) break;
}
```

The `status` filter uses its own camelCase vocabulary (`OrderListStatus`) which is **not** the same as `OrderStage` on the order body.

### Quotes

```ts
client.quotes.create(request: CreateQuoteRequest): Promise<QuoteOutcome>
```

### Products

```ts
client.products.get(sku: string): Promise<ProductOutcome>
client.products.getSpine(request: SpineRequest): Promise<SpineResponse>
```

### Catalogue

Browse the public product catalogue (no API key required):

```ts
client.catalogue.list(): Promise<CatalogueListResponse>
client.catalogue.get(slug: string): Promise<CatalogueProductDetail>
```

## Webhooks (callbacks)

Set `callbackUrl` on an order — or a global callback URL in your Prodigi dashboard — and Prodigi POSTs a [CloudEvents v1.0](https://cloudevents.io/) envelope to it as the order progresses.

`parseCallbackEvent()` validates the envelope and returns a discriminated union you can `switch` on:

```ts
import { parseCallbackEvent, ProdigiWebhookError } from "prodigi-print-api";

app.post("/prodigi/callback", async (req, res) => {
  let event;
  try {
    event = parseCallbackEvent(req.body); // JSON string or parsed object
  } catch (err) {
    if (err instanceof ProdigiWebhookError) return res.sendStatus(400);
    throw err;
  }

  switch (event.kind) {
    case "order.status.stage.changed":
      console.log(event.subject, event.order.status.stage);
      break;
    case "order.shipments.shipment":
      console.log(event.order.shipments);
      break;
    case "unknown":
      console.log("unhandled Prodigi event", event.eventType);
      break;
  }

  res.sendStatus(200);
});
```

Every member carries `event` (the raw envelope), `id`, `subject` (the order ID), `time`, `order`, `eventType` (the CloudEvents `type` with the `#fragment` stripped) and `changedTo` (the fragment, e.g. `"InProgress"`).

Unrecognised event types resolve to `kind: "unknown"` rather than throwing, so a handler keeps working when Prodigi adds new events.

`isCallbackEvent(payload)` is exported separately if you only want the type guard.

### ⚠️ Prodigi does not sign callbacks

**There is no signature header, shared secret, HMAC, or any other authentication mechanism for Prodigi callbacks in the v4.0 API.** `parseCallbackEvent()` therefore validates _shape only_ — it cannot tell you that a request genuinely came from Prodigi, and this SDK deliberately does not invent a verification scheme that Prodigi does not implement.

Anyone who learns your callback URL can post a convincing-looking event to it. Mitigate it yourself:

1. **Treat the callback URL as the secret.** Use a long, unguessable path (e.g. `/prodigi/callback/<32 random chars>`) and never log or share it.
2. **Re-read the order before acting on anything that matters.** The callback tells you _something changed_; `client.orders.get(event.subject)` tells you what is actually true.
3. **Serve the endpoint over HTTPS** and treat the payload as untrusted input.

If Prodigi ships a signing mechanism, this section and the helper will be updated to use it.

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
    console.log(err.data); // raw error body (parsed JSON, or raw text if not JSON)
  }
}
```

| Error                 | Extends        | Thrown when                                 |
| --------------------- | -------------- | ------------------------------------------- |
| `ProdigiError`        | `Error`        | Base class — e.g. `OrderBuilder` validation |
| `ProdigiApiError`     | `ProdigiError` | The API returned a non-OK response          |
| `ProdigiWebhookError` | `ProdigiError` | A callback payload failed validation        |

Network failures are rethrown as-is (a `TypeError` from `fetch`) after retries are exhausted.

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
  OrderListStatus,
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

  // Catalogue
  CatalogueListResponse,
  CatalogueCategory,
  CatalogueProductSummary,
  CatalogueProductDetail,
  CatalogueVariantRow,
  CatalogueVariantAsset,

  // Callbacks
  CallbackEvent,
  CallbackEventData,
  ProdigiCallbackEvent,
  OrderStageChangedEvent,
  OrderShipmentEvent,
  UnknownCallbackEvent,

  // Client
  ProdigiClientOptions,
  Environment,
  RetryOptions,
  RetryPolicy,
} from "prodigi-print-api";
```

## Development

```sh
npm test           # run unit tests (vitest)
npm run test:e2e   # run e2e tests against the Prodigi sandbox (needs API_KEY)
npm run build      # build ESM + CJS (tsup)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint .
```

The e2e suite hits the live sandbox and creates (then cancels) a real sandbox order. Copy `.env.example` to `.env` and set `API_KEY` to a sandbox key to run it locally.

## CI/CD

### Publish (`.github/workflows/publish.yml`)

Pushing to `main` or `test`:

1. Runs lint, typecheck, and tests
2. Bumps the **patch** version automatically
3. On the `test` branch, appends a `-test` prerelease suffix
4. Commits, tags, and pushes the version bump
5. Publishes to npm with provenance (the `test` branch publishes under the `test` dist-tag)

Publishing uses npm OIDC trusted publishing, so no npm token secret is required.

**Cutting a minor or major release.** Step 2 is skipped when `package.json` is already ahead of the version published on npm, and that version is published as-is. So bump deliberately on your branch before merging:

```sh
npm version minor --no-git-tag-version   # or major
```

### E2E (`.github/workflows/e2e.yml`)

Runs the sandbox e2e suite daily at 06:00 UTC, and on manual dispatch, to catch contract drift with Prodigi that unit tests cannot see.

**Optional secret:** `PRODIGI_SANDBOX_API_KEY` — a Prodigi **sandbox** API key. When the secret is absent the workflow skips cleanly and the job stays green, so forks and fresh clones are unaffected.

## License

MIT
