# API Reference

Full reference for all classes, methods, and types exported by `prodigi-print-api`.

## Table of Contents

- [ProdigiClient](#prodigiclient)
- [OrderBuilder](#orderbuilder)
- [Resources](#resources)
  - [Orders](#orders)
  - [Quotes](#quotes)
  - [Products](#products)
- [Error Handling](#error-handling)
- [Types](#types)
  - [Common](#common)
  - [Orders](#order-types)
  - [Quotes](#quote-types)
  - [Products](#product-types)
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
}
```

| Environment  | Base URL                               |
| ------------ | -------------------------------------- |
| `sandbox`    | `https://api.sandbox.prodigi.com/v4.0` |
| `production` | `https://api.prodigi.com/v4.0`         |

### Properties

| Property   | Type               | Description          |
| ---------- | ------------------ | -------------------- |
| `orders`   | `OrdersResource`   | Orders API methods   |
| `quotes`   | `QuotesResource`   | Quotes API methods   |
| `products` | `ProductsResource` | Products API methods |

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
| `addPrint`          | `(sku: string, imageUrl: string, options?: { copies?: number; sizing?: Sizing }) => this` | Shorthand to add a single-asset print item. Defaults: `copies = 1`, `sizing` omitted.                                     |
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

#### `client.orders.get(orderId)`

Retrieve a single order by ID.

- **Parameters:** `orderId: string`
- **Returns:** `Promise<OrderOutcome>`

#### `client.orders.list(params?)`

List orders with optional filtering.

- **Parameters:** `params?: ListOrdersParams`
- **Returns:** `Promise<ListOrdersResponse>`

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

#### `client.products.list(params?)`

List products with optional filtering.

- **Parameters:** `params?: ListProductsParams`
- **Returns:** `Promise<ListProductsResponse>`

#### `client.products.getSpine(request)`

Get spine width information for book products.

- **Parameters:** `request: SpineRequest`
- **Returns:** `Promise<SpineResponse>`

---

## Error Handling

```ts
import { ProdigiError, ProdigiApiError } from "prodigi-print-api";
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

| Property      | Type             | Description                  |
| ------------- | ---------------- | ---------------------------- |
| `statusCode`  | `number`         | HTTP status code             |
| `traceParent` | `string \| null` | Trace ID for Prodigi support |
| `data`        | `unknown`        | Raw error response body      |

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
  status: string;
}

interface CreateOrderItem {
  merchantReference?: string;
  sku: string;
  copies: number;
  sizing?: Sizing;
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

interface ListOrdersParams {
  top?: number;
  skip?: number;
  merchantReference?: string;
  status?: string;
  orderIds?: string[];
  merchantReferences?: string[];
  createdFrom?: string;
  createdTo?: string;
}

interface OrderOutcome {
  outcome: "Ok" | "Created" | "AlreadyExists" | "CreatedWithIssues" | "OnHold";
  order: Order;
  traceParent: string;
}

interface ListOrdersResponse {
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
  sizing?: Sizing;
  assets: { printArea?: string }[];
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

interface ListProductsParams {
  sku?: string;
  top?: number;
  skip?: number;
}

interface ListProductsResponse {
  products: Product[];
  hasMore: boolean;
  nextUrl?: string;
  traceParent: string;
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

Set `callbackUrl` on an order to receive status change notifications.

```ts
interface CallbackEvent {
  specversion: string;
  type: string;
  source: string;
  id: string;
  time: string;
  datacontenttype: string;
  subject: string;
  data: Order;
}
```

| Field             | Example                                             | Description                  |
| ----------------- | --------------------------------------------------- | ---------------------------- |
| `specversion`     | `"1.0"`                                             | CloudEvents spec version     |
| `type`            | `"com.prodigi.order.status.stage.changed#Complete"` | Event type with stage suffix |
| `source`          | `"https://api.prodigi.com/v4.0"`                    | API endpoint URI             |
| `id`              | `"evt_305174"`                                      | Unique event ID              |
| `time`            | `"2024-01-15T10:30:00Z"`                            | RFC 3339 timestamp           |
| `datacontenttype` | `"application/json"`                                | Always JSON                  |
| `subject`         | `"ord_1234567"`                                     | Order ID                     |
| `data`            |                                                     | Full `Order` object          |
