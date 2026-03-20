import type {
  Cost,
  OrderStage,
  Recipient,
  ShippingMethod,
  Sizing,
} from "./common.js";

export interface Asset {
  id?: string;
  printArea?: string;
  url: string;
  status?: string;
  md5Hash?: string;
  thumbnailUrl?: string;
  pageCount?: number;
}

export interface OrderItemAttribute {
  name: string;
  value: string;
}

export interface BrandingAsset {
  url: string;
}

export interface Branding {
  postcard?: BrandingAsset;
  flyer?: BrandingAsset;
  packing_slip_bw?: BrandingAsset;
  packing_slip_color?: BrandingAsset;
  sticker_exterior_round?: BrandingAsset;
  sticker_exterior_rectangle?: BrandingAsset;
  sticker_interior_round?: BrandingAsset;
  sticker_interior_rectangle?: BrandingAsset;
}

export interface PackingSlip {
  url: string;
  status?: string;
}

export interface CreateOrderItem {
  merchantReference?: string;
  sku: string;
  copies: number;
  sizing: Sizing;
  attributes?: Record<string, string>;
  assets: Asset[];
  recipientCost?: Cost;
}

export interface CreateOrderRequest {
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

export interface StatusChange {
  status: string;
  timestamp: string;
}

export interface FulfillmentLocation {
  countryCode: string;
  labCode: string;
}

export interface OrderItem {
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

export interface Shipment {
  id: string;
  carrier: { name: string; service: string };
  tracking?: { url: string; number: string };
  status: string;
  dispatchDate?: string;
  items: { itemId: string }[];
  fulfillmentLocation: FulfillmentLocation;
}

export interface ChargeItem {
  id?: string;
  shipmentId?: string;
  itemId?: string;
  cost?: Cost;
}

export interface Charge {
  id: string;
  prodigiInvoiceNumber?: string;
  totalCost: Cost;
  chargeType: string;
  items: ChargeItem[];
}

export interface AuthorisationDetails {
  authorisationUrl: string;
  paymentDetails?: Cost;
}

export interface Issue {
  objectId: string;
  errorCode: string;
  description: string;
  authorisationDetails?: AuthorisationDetails;
}

export type StatusDetailStatus =
  | "NotStarted"
  | "InProgress"
  | "Complete"
  | "Error";

export interface OrderStatusDetail {
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

export interface Order {
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

export interface OrderOutcome {
  outcome: "Ok" | "Created" | "AlreadyExists" | "CreatedWithIssues" | "OnHold";
  order: Order;
  traceParent: string;
}
