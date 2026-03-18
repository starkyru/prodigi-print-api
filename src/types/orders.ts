import type {
  Cost,
  OrderStage,
  OrderStatus,
  Recipient,
  ShippingMethod,
  Sizing,
} from "./common.js";

export interface Asset {
  printArea?: string;
  url: string;
  md5Hash?: string;
  thumbnailUrl?: string;
}

export interface OrderItemAttribute {
  name: string;
  value: string;
}

export interface CreateOrderItem {
  merchantReference?: string;
  sku: string;
  copies: number;
  sizing?: Sizing;
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
}

export interface StatusChange {
  status: OrderStatus;
  timestamp: string;
}

export interface FulfilmentLocation {
  countryCode: string;
  labCode: string;
}

export interface OrderItem {
  id: string;
  status: OrderStatus;
  merchantReference?: string;
  sku: string;
  copies: number;
  sizing: Sizing;
  attributes: Record<string, string>;
  assets: Asset[];
  recipientCost?: Cost;
  statusChanges: StatusChange[];
}

export interface Shipment {
  id: string;
  carrier: string;
  tracking?: string;
  dispatchDate?: string;
  items: { itemId: string }[];
  fulfilmentLocation: FulfilmentLocation;
}

export interface ChargeItem {
  id?: string;
  merchantReference?: string;
  sku?: string;
  description?: string;
  itemCost?: Cost;
  shipmentCost?: Cost;
}

export interface Charge {
  id: string;
  prodigiInvoiceNumber?: string;
  totalCost: Cost;
  totalTax: Cost;
  items: ChargeItem[];
}

export interface OrderStatusDetail {
  stage: OrderStage;
  details: {
    description: string;
    authorisationDetails?: {
      authorisationUrl?: string;
      paymentDetails?: {
        status: string;
      };
    };
  };
  downloadAssets?: string;
  printReadyAssetsPrepared?: string;
  allocatedToLab?: string;
  inProduction?: string;
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
}

export interface ListOrdersParams {
  top?: number;
  skip?: number;
  merchantReference?: string;
  status?: string;
  orderIds?: string[];
  merchantReferences?: string[];
  createdFrom?: string;
  createdTo?: string;
}

export interface OrderOutcome {
  outcome: "Created" | "AlreadyExists" | "CreatedWithIssues";
  order: Order;
  traceParent: string;
}

export interface ListOrdersResponse {
  orders: Order[];
  hasMore: boolean;
}
