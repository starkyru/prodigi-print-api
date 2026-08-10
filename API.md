# API Reference

Full reference for all classes, methods, and types exported by `prodigi-print-api`.

## Table of Contents

- [ProdigiClient](#prodigiclient)
- [OrderBuilder](#orderbuilder)
- [Resources](#resources)
  - [Orders](#orders)
  - [Quotes](#quotes)
  - [Products](#products)
  - [Catalogue](#catalogue)
- [Webhooks](#webhooks)
- [Retries](#retries)
- [Error Handling](#error-handling)
- [Types](#types)
  - [Common](#common)
  - [Orders](#order-types)
  - [Quotes](#quote-types)
  - [Products](#product-types)
  - [Catalogue](#catalogue-types)
  - [Actions](#action-types)
  - [Callbacks](#callback-types)

---

## ProdigiClient

Main entry point for the SDK.

```ts
import { ProdigiClient } from "prodigi-print-api";

const client = new ProdigiClient({
  apiKey: "your-api-key",
  environment: "sandbox", // optional, defaults to "sandbox"
});
```

### Options

```ts
type Environment = "sandbox" | "production";

interface ProdigiClientOptions {
  apiKey: string;
  environment?: Environment;
  /** Retry policy for transient failures, or `false` to disable. */
  retry?: RetryOptions | false;
}
```

See [Retries](#retries) for the `retry` option.

| Environment  | Base URL                               |
| ------------ | -------------------------------------- |
| `sandbox`    | `https://api.sandbox.prodigi.com/v4.0` |
| `production` | `https://api.prodigi.com/v4.0`         |

### Properties

| Property    | Type                | Description                             |
| ----------- | ------------------- | --------------------------------------- |
| `orders`    | `OrdersResource`    | Orders API methods                      |
| `quotes`    | `QuotesResource`    | Quotes API methods                      |
| `products`  | `ProductsResource`  | Products API methods                    |
| `catalogue` | `CatalogueResource` | Public catalogue API (no auth required) |

---

## OrderBuilder

Fluent builder for constructing `CreateOrderRequest` objects. All setter methods return `this` for chaining.

```ts
import { OrderBuilder } from "prodigi-print-api";

const order = new OrderBuilder()
  .shippingMethod("Standard")
  .recipient({ name: "Jane", address: { ... } })
  .addPrint("GLOBAL-PHO-4x6", "https://example.com/photo.jpg")
  .build();
```

### Methods

| Method              | Signature                                                                                 | Description                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `shippingMethod`    | `(method: ShippingMethod) => this`                                                        | **Required.** Set shipping method.                                                                                        |
| `recipient`         | `(recipient: Recipient) => this`                                                          | **Required.** Set recipient details.                                                                                      |
| `addItem`           | `(item: CreateOrderItem) => this`                                                         | Add a fully specified order item.                                                                                         |
| `addPrint`          | `(sku: string, imageUrl: string, options?: { copies?: number; sizing?: Sizing }) => this` | Shorthand to add a single-asset print item. Defaults: `copies = 1`, `sizing = "fillPrintArea"`.                           |
| `merchantReference` | `(ref: string) => this`                                                                   | Set merchant reference.                                                                                                   |
| `metadata`          | `(metadata: Record<string, string>) => this`                                              | Set order metadata.                                                                                                       |
| `idempotencyKey`    | `(key: string) => this`                                                                   | Set idempotency key.                                                                                                      |
| `build`             | `() => CreateOrderRequest`                                                                | Validate and return the request. Throws `ProdigiError` if `shippingMethod`, `recipient`, or at least one item is missing. |

---

## Resources

### Orders

#### `client.orders.create(request)`

Create a new order.

- **Parameters:** `request: CreateOrderRequest`
- **Returns:** `Promise<OrderOutcome>`
- **Retries:** only when `request.idempotencyKey` is set — see [Retries](#retries).

#### `client.orders.get(orderId)`

Retrieve a single order by ID.

- **Parameters:** `orderId: string`
- **Returns:** `Promise<OrderOutcome>`

#### `client.orders.list(params?)`

List orders with optional filtering and pagination. Maps to `GET /orders`.

- **Parameters:** `params?: ListOrdersParams`
- **Returns:** `Promise<ListOrdersResponse>`

| Filter               | Query parameter      | Notes                                                                        |
| -------------------- | -------------------- | ---------------------------------------------------------------------------- |
| `top`                | `top`                | 1–100. Server default 10.                                                    |
| `skip`               | `skip`               | `>= 0`. Server default 0.                                                    |
| `createdFrom`        | `createdFrom`        | `Date` or ISO 8601 string. A `Date` is serialized with `toISOString()`.      |
| `createdTo`          | `createdTo`          | `Date` or ISO 8601 string.                                                   |
| `status`             | `status`             | One `OrderListStatus` value.                                                 |
| `orderIds`           | `orderIds`           | Repeated once per value.                                                     |
| `merchantReferences` | `merchantReferences` | **Plural, and an array** — not `merchantReference`. Repeated once per value. |

Filters that are not supplied are omitted from the query string entirely.

#### `client.orders.getActions(orderId)`

Get available actions for an order.

- **Parameters:** `orderId: string`
- **Returns:** `Promise<OrderActions>`

#### `client.orders.cancel(orderId)`

Cancel an order.

- **Parameters:** `orderId: string`
- **Returns:** `Promise<ActionOutcome>`

#### `client.orders.updateShippingMethod(orderId, request)`

Update the shipping method for an order.

- **Parameters:** `orderId: string`, `request: UpdateShippingMethodRequest`
- **Returns:** `Promise<ShippingActionOutcome>`

#### `client.orders.updateRecipient(orderId, request)`

Update recipient details for an order.

- **Parameters:** `orderId: string`, `request: UpdateRecipientRequest` (flat recipient fields, not nested)
- **Returns:** `Promise<RecipientActionOutcome>`

#### `client.orders.updateMetadata(orderId, request)`

Update metadata for an order.

- **Parameters:** `orderId: string`, `request: UpdateMetadataRequest`
- **Returns:** `Promise<ActionOutcome>`

### Quotes

#### `client.quotes.create(request)`

Create a quote for a potential order.

- **Parameters:** `request: CreateQuoteRequest`
- **Returns:** `Promise<QuoteOutcome>`

### Products

#### `client.products.get(sku)`

Get product details by SKU.

- **Parameters:** `sku: string`
- **Returns:** `Promise<ProductOutcome>`

#### `client.products.getSpine(request)`

Get spine width information for book products.

- **Parameters:** `request: SpineRequest`
- **Returns:** `Promise<SpineResponse>`

### Catalogue

The catalogue resource uses Prodigi's public product API (`https://product-api-app-live.azurewebsites.net/api`) and requires no authentication.

#### `client.catalogue.list()`

List all categories and products in the catalogue.

- **Returns:** `Promise<CatalogueListResponse>` (`Record<string, CatalogueCategory>`)

#### `client.catalogue.get(slug)`

Get detailed product information including all SKU variants, sizes, asset dimensions, and pricing.

- **Parameters:** `slug: string` — product slug (e.g. `"cold-press-watercolour-paper"`)
- **Returns:** `Promise<CatalogueProductDetail>`

---

## Webhooks

```ts
import { parseCallbackEvent, isCallbackEvent } from "prodigi-print-api";
```

### `parseCallbackEvent(payload)`

Validate an incoming Prodigi callback and parse it into a typed event.

- **Parameters:** `payload: unknown` — the request body, either a JSON string or already-parsed JSON.
- **Returns:** `ProdigiCallbackEvent` — a discriminated union keyed on `kind`.
- **Throws:** `ProdigiWebhookError` if the body is not JSON, or not a Prodigi callback envelope.

```ts
const event = parseCallbackEvent(await request.text());

switch (event.kind) {
  case "order.status.stage.changed":
    // event.order.status.stage is typed as OrderStage
    break;
  case "order.shipments.shipment":
    break;
  case "unknown":
    // forward-compatible: new Prodigi event types land here
    break;
}
```

### `isCallbackEvent(payload)`

Structural type guard for the raw envelope.

- **Parameters:** `payload: unknown`
- **Returns:** `payload is CallbackEvent`

Checks the CloudEvents attributes and that `data.order.id` is a non-empty string. It does not deep-validate the order.

### Authenticity

Prodigi does **not** sign callbacks — the v4.0 API has no signature header, shared secret, or other authentication mechanism. Both functions validate **shape only** and cannot establish that a request came from Prodigi. This SDK does not invent a verification scheme Prodigi does not implement.

Protect the endpoint by keeping the callback URL unguessable and re-reading the order with `client.orders.get(event.subject)` before acting on it.

---

## Retries

Transient failures are retried with exponential backoff and equal jitter.

```ts
import { DEFAULT_RETRY_POLICY } from "prodigi-print-api";

interface RetryOptions {
  maxAttempts?: number; // default 3, clamped to >= 1
  initialDelayMs?: number; // default 500
  maxDelayMs?: number; // default 8000
  maxRetryAfterMs?: number; // default 30000
  jitter?: boolean; // default true
  retryNetworkErrors?: boolean; // default true
}

type RetryPolicy = Required<RetryOptions>;
```

| Condition               | Retried?                                |
| ----------------------- | --------------------------------------- |
| `429 Too Many Requests` | Yes                                     |
| `5xx` except `501`      | Yes                                     |
| `fetch` rejects         | Yes, unless `retryNetworkErrors: false` |
| `4xx` other than `429`  | No                                      |
| `501 Not Implemented`   | No                                      |

**Method safety.** `GET` is always retryable. `POST` is not retried, because replaying it can duplicate a side effect — except `orders.create()` when `idempotencyKey` is set on the request.

**Delay.** `initialDelayMs * 2 ** (attempt - 1)`, capped at `maxDelayMs`. With `jitter` on, the delay is drawn from the upper half of that window (`capped / 2 + random * capped / 2`), so it never collapses to zero.

**`Retry-After`.** Honoured when present, in both the delta-seconds and HTTP-date forms, taking precedence over the computed delay. A value above `maxRetryAfterMs` aborts the retry and throws rather than stalling the request.

Pass `retry: false` to disable retries entirely.

---

## Error Handling

```ts
import {
  ProdigiError,
  ProdigiApiError,
  ProdigiWebhookError,
} from "prodigi-print-api";
```

### `ProdigiError`

Base error class for SDK errors (e.g. builder validation failures).

```ts
class ProdigiError extends Error {
  constructor(message: string);
}
```

### `ProdigiApiError`

Thrown when the Prodigi API returns a non-OK response.

```ts
class ProdigiApiError extends ProdigiError {
  readonly statusCode: number;
  readonly traceParent: string | null;
  readonly data: unknown;
}
```

| Property      | Type             | Description                                                         |
| ------------- | ---------------- | ------------------------------------------------------------------- |
| `statusCode`  | `number`         | HTTP status code                                                    |
| `traceParent` | `string \| null` | Trace ID for Prodigi support                                        |
| `data`        | `unknown`        | Parsed JSON error body, or the raw string when the body is not JSON |

### `ProdigiWebhookError`

Thrown by [`parseCallbackEvent`](#webhooks) when a callback payload is not valid.

```ts
class ProdigiWebhookError extends ProdigiError {
  readonly payload: unknown;
}
```

| Property  | Type      | Description                       |
| --------- | --------- | --------------------------------- |
| `payload` | `unknown` | The rejected payload, for logging |

Network failures are rethrown unchanged (a `TypeError` from `fetch`) once retries are exhausted.

---

## Types

All types are exported from the package root:

```ts
import type { Order, CreateOrderRequest, ... } from "prodigi-print-api";
```

### Common

```ts
type ShippingMethod =
  | "Budget"
  | "Standard"
  | "StandardPlus"
  | "Express"
  | "Overnight";

type Sizing = "fillPrintArea" | "fitPrintArea" | "stretchToPrintArea";

type OrderStage = "InProgress" | "Complete" | "Cancelled";

type OrderStatus =
  | "AwaitingPayment"
  | "NotYetDownloaded"
  | "Downloaded"
  | "Printing"
  | "QualityControl"
  | "Dispatched"
  | "WithCarrier"
  | "InTransit"
  | "Delivered"
  | "Cancelled"
  | "OnHold";

interface Cost {
  amount: string;
  currency: string;
}

interface Address {
  line1: string;
  line2?: string;
  postalOrZipCode: string;
  countryCode: string;
  townOrCity: string;
  stateOrCounty?: string;
}

interface Recipient {
  name: string;
  email?: string;
  phoneNumber?: string;
  address: Address;
}
```

### Order Types

```ts
interface Asset {
  id?: string;
  printArea?: string;
  url: string;
  status?: string;
  md5Hash?: string;
  thumbnailUrl?: string;
  pageCount?: number;
}

interface OrderItemAttribute {
  name: string;
  value: string;
}

interface BrandingAsset {
  url: string;
}

interface Branding {
  postcard?: BrandingAsset;
  flyer?: BrandingAsset;
  packing_slip_bw?: BrandingAsset;
  packing_slip_color?: BrandingAsset;
  sticker_exterior_round?: BrandingAsset;
  sticker_exterior_rectangle?: BrandingAsset;
  sticker_interior_round?: BrandingAsset;
  sticker_interior_rectangle?: BrandingAsset;
}

interface PackingSlip {
  url: string;
  status?: string;
}

interface CreateOrderItem {
  merchantReference?: string;
  sku: string;
  copies: number;
  sizing: Sizing;
  attributes?: Record<string, string>;
  assets: Asset[];
  recipientCost?: Cost;
}

interface CreateOrderRequest {
  merchantReference?: string;
  shippingMethod: ShippingMethod;
  recipient: Recipient;
  items: CreateOrderItem[];
  metadata?: Record<string, string>;
  idempotencyKey?: string;
  callbackUrl?: string;
  branding?: Branding;
  packingSlip?: { url: string };
}

interface StatusChange {
  status: string;
  timestamp: string;
}

interface FulfillmentLocation {
  countryCode: string;
  labCode: string;
}

interface OrderItem {
  id: string;
  status: string;
  merchantReference?: string;
  sku: string;
  copies: number;
  sizing: Sizing;
  attributes: Record<string, string>;
  assets: Asset[];
  recipientCost?: Cost;
  statusChanges?: StatusChange[];
}

interface Shipment {
  id: string;
  carrier: { name: string; service: string };
  tracking?: { url: string; number: string };
  status: string;
  dispatchDate?: string;
  items: { itemId: string }[];
  fulfillmentLocation: FulfillmentLocation;
}

interface ChargeItem {
  id?: string;
  shipmentId?: string;
  itemId?: string;
  cost?: Cost;
}

interface Charge {
  id: string;
  prodigiInvoiceNumber?: string;
  totalCost: Cost;
  chargeType: string;
  items: ChargeItem[];
}

interface AuthorisationDetails {
  authorisationUrl: string;
  paymentDetails?: Cost;
}

interface Issue {
  objectId: string;
  errorCode: string;
  description: string;
  authorisationDetails?: AuthorisationDetails;
}

type StatusDetailStatus = "NotStarted" | "InProgress" | "Complete" | "Error";

interface OrderStatusDetail {
  stage: OrderStage;
  issues: Issue[];
  details: {
    downloadAssets: StatusDetailStatus;
    printReadyAssetsPrepared: StatusDetailStatus;
    allocateProductionLocation: StatusDetailStatus;
    inProduction: StatusDetailStatus;
    shipping: StatusDetailStatus;
  };
}

interface Order {
  id: string;
  created: string;
  lastUpdated: string;
  callbackUrl?: string;
  merchantReference?: string;
  shippingMethod: ShippingMethod;
  idempotencyKey?: string;
  status: OrderStatusDetail;
  charges: Charge[];
  shipments: Shipment[];
  recipient: Recipient;
  items: OrderItem[];
  metadata?: Record<string, string>;
  branding?: Branding;
  packingSlip?: PackingSlip;
}

interface OrderOutcome {
  outcome: "Ok" | "Created" | "AlreadyExists" | "CreatedWithIssues" | "OnHold";
  order: Order;
  traceParent: string;
}

/**
 * Status values accepted by the `status` filter on GET /orders.
 * Deliberately distinct from OrderStage — camelCase, plus draft and
 * awaitingPayment, which are not stage values.
 */
type OrderListStatus =
  | "draft"
  | "awaitingPayment"
  | "inProgress"
  | "complete"
  | "cancelled";

interface ListOrdersParams {
  top?: number;
  skip?: number;
  createdFrom?: string | Date;
  createdTo?: string | Date;
  status?: OrderListStatus;
  orderIds?: string[];
  merchantReferences?: string[];
}

interface ListOrdersResponse {
  outcome: string;
  orders: Order[];
  hasMore: boolean;
  nextUrl?: string;
  traceParent: string;
}
```

### Quote Types

```ts
interface QuoteItem {
  sku: string;
  copies: number;
  attributes?: Record<string, string>;
  assets: { printArea: string }[];
}

interface CreateQuoteRequest {
  shippingMethod?: ShippingMethod;
  destinationCountryCode: string;
  items: QuoteItem[];
  currencyCode?: string;
}

interface QuoteCostItem {
  id?: string;
  sku: string;
  copies: number;
  unitCost: Cost;
  totalCost?: Cost;
  attributes?: Record<string, string>;
  assets?: { printArea?: string }[];
}

interface QuoteShipment {
  carrier: { name: string; service: string };
  cost: Cost;
  items: string[];
  fulfillmentLocation: { countryCode: string; labCode: string };
}

interface Quote {
  shipmentMethod: string;
  costSummary: {
    items: Cost;
    shipping: Cost;
  };
  items: QuoteCostItem[];
  shipments: QuoteShipment[];
}

interface QuoteIssue {
  errorCode: string;
  description: string;
}

interface QuoteOutcome {
  outcome: string;
  quotes: Quote[];
  issues?: QuoteIssue[];
  traceParent: string;
}
```

### Product Types

```ts
interface PrintAreaSize {
  horizontalResolution: number;
  verticalResolution: number;
}

interface Variant {
  attributes: Record<string, string>;
  shipsTo: string[];
  printAreaSizes: Record<string, PrintAreaSize>;
}

interface Product {
  sku: string;
  description: string;
  productDimensions?: {
    width: number;
    height: number;
    units: string;
  };
  attributes: Record<string, string[]>;
  printAreas: Record<string, { required: boolean }>;
  variants: Variant[];
}

interface ProductOutcome {
  outcome: string;
  product: Product;
  traceParent: string;
}

interface SpineRequest {
  sku: string;
  destinationCountryCode: string;
  state?: string;
  numberOfPages: number;
}

interface SpineResponse {
  success: boolean;
  message: string;
  spineInfo: {
    widthMm: number;
  };
}
```

### Catalogue Types

```ts
interface CataloguePricing {
  source: string;
  value: string;
}

interface CatalogueProductSummary {
  name: string;
  slug: string;
  productSlug: string;
  global: boolean;
  sizes: string[];
  pricing: CataloguePricing[];
  manufacturingRegions: string[];
  image: string;
  imageRequired: boolean;
  loreSlug?: string;
}

interface CatalogueCategory {
  name: string;
  slug: string;
  fullSlug?: string;
  images?: string[];
  products: Record<string, CatalogueProductSummary>;
  subCategories: Record<string, CatalogueCategory>;
}

type CatalogueListResponse = Record<string, CatalogueCategory>;

interface CatalogueVariantAsset {
  name: string;
  required: boolean;
  horizontalInches: number;
  verticalInches: number;
  sizeUnits: string;
  outputDpi: number;
  fileOutputFormat: string;
}

interface CatalogueVariantAttribute {
  value: string[];
}

interface CatalogueVariantRow {
  sku: string;
  description: string;
  attributeDescription: string;
  productType: string;
  price: string;
  assets: CatalogueVariantAsset[];
  size?: string;
  orientation?: string;
  fulfilledFrom?: string;
}

interface CatalogueVariantColumn {
  enableSorting: boolean;
  name: string;
  filterType: string;
  options?: string[];
}

interface CatalogueVariants {
  columns: Record<string, CatalogueVariantColumn>;
  rows: CatalogueVariantRow[];
}

interface CatalogueManufacturing {
  regions: string[];
  time: string;
  shipsTo: string[];
}

interface CatalogueProductDetail {
  name: string;
  availability: string;
  description: string[];
  features: string[];
  manufacturing: CatalogueManufacturing;
  pricing: CataloguePricing[];
  variants: CatalogueVariants;
  sizes: string[];
}
```

### Action Types

```ts
interface ActionAvailability {
  isAvailable: string;
}

interface OrderActions {
  outcome: string;
  cancel: ActionAvailability;
  changeRecipientDetails: ActionAvailability;
  changeShippingMethod: ActionAvailability;
  changeMetaData: ActionAvailability;
  traceParent: string;
}

interface UpdateShippingMethodRequest {
  shippingMethod: ShippingMethod;
}

interface UpdateRecipientRequest {
  name: string;
  email?: string;
  phoneNumber?: string;
  address: Address;
}

interface UpdateMetadataRequest {
  metadata: Record<string, string>;
}

interface ShipmentUpdateResult {
  shipmentId: string;
  successful: boolean;
  errorCode?: string;
  description?: string;
}

interface ActionOutcome {
  outcome: string;
  order: Order;
  traceParent: string;
}

interface ShippingActionOutcome extends ActionOutcome {
  shippingUpdateResults?: ShipmentUpdateResult[];
}

interface RecipientActionOutcome extends ActionOutcome {
  shipmentUpdateResults?: ShipmentUpdateResult[];
}
```

### Callback Types

Types for handling [Prodigi webhook callbacks](https://www.prodigi.com/print-api/docs/reference/#callbacks) (CloudEvents v1.0).

Set `callbackUrl` on an order to receive status change notifications. Use [`parseCallbackEvent`](#webhooks) to validate and narrow an incoming payload.

#### Raw envelope

```ts
interface CallbackEventData {
  order: Order;
}

interface CallbackEvent {
  specversion: string;
  type: string;
  source: string;
  id: string;
  time: string;
  datacontenttype: string;
  subject: string;
  data: CallbackEventData;
}
```

| Field             | Example                                             | Description                             |
| ----------------- | --------------------------------------------------- | --------------------------------------- |
| `specversion`     | `"1.0"`                                             | CloudEvents spec version                |
| `type`            | `"com.prodigi.order.status.stage.changed#Complete"` | Event type with new value after `#`     |
| `source`          | `"https://api.prodigi.com/v4.0/Orders/"`            | API endpoint URI                        |
| `id`              | `"evt_305174"`                                      | Unique event ID, prefixed `evt_`        |
| `time`            | `"2024-01-15T10:30:00Z"`                            | RFC 3339 timestamp                      |
| `datacontenttype` | `"application/json"`                                | Always JSON                             |
| `subject`         | `"ord_1234567"`                                     | Order ID                                |
| `data`            | `{ order: { ... } }`                                | Wrapper object holding the full `Order` |

> **Note:** `data` wraps the order as `{ order }` — it is not the `Order` itself.

#### Parsed events

```ts
interface CallbackEventBase {
  /** The raw envelope exactly as delivered. */
  event: CallbackEvent;
  id: string;
  /** Order ID (CloudEvents `subject`). */
  subject: string;
  time: string;
  order: Order;
  /** CloudEvents `type` with the `#fragment` stripped. */
  eventType: string;
  /** Value after `#`, e.g. "InProgress". Empty string when absent. */
  changedTo: string;
}

interface OrderStageChangedEvent extends CallbackEventBase {
  kind: "order.status.stage.changed";
}

interface OrderShipmentEvent extends CallbackEventBase {
  kind: "order.shipments.shipment";
}

interface UnknownCallbackEvent extends CallbackEventBase {
  kind: "unknown";
}

type ProdigiCallbackEvent =
  | OrderStageChangedEvent
  | OrderShipmentEvent
  | UnknownCallbackEvent;
```

Prodigi documents the stage-change `type` verbatim but not the shipment one, so shipment classification matches on the `com.prodigi.order.shipments` prefix implied by their documented naming convention. Anything unmatched still parses, as `UnknownCallbackEvent` — so an unrecognised or newly added event never throws.

Both constants are exported if you need to match on them yourself:

```ts
const ORDER_STAGE_CHANGED_TYPE = "com.prodigi.order.status.stage.changed";
const ORDER_SHIPMENT_TYPE_PREFIX = "com.prodigi.order.shipments";
```
