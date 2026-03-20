import type { Cost, ShippingMethod, Sizing } from "./common.js";

export interface QuoteItem {
  sku: string;
  copies: number;
  attributes?: Record<string, string>;
  sizing?: Sizing;
  assets: { printArea?: string }[];
}

export interface CreateQuoteRequest {
  shippingMethod: ShippingMethod;
  destinationCountryCode: string;
  items: QuoteItem[];
  currencyCode?: string;
}

export interface QuoteCostItem {
  sku: string;
  quantity: number;
  unitCost: Cost;
  totalCost: Cost;
}

export interface QuoteShipment {
  carrier: { name: string; service: string };
  cost: Cost;
  items: { sku: string }[];
  fulfillmentLocation: { countryCode: string; labCode: string };
}

export interface Quote {
  shipmentMethod: string;
  costSummary: {
    items: Cost;
    shipping: Cost;
  };
  items: QuoteCostItem[];
  shipments: QuoteShipment[];
}

export interface QuoteOutcome {
  outcome: string;
  quotes: Quote[];
}
