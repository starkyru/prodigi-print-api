import type { Cost, ShippingMethod, Sizing } from "./common.js";

export interface QuoteItem {
  sku: string;
  copies: number;
  attributes?: Record<string, string>;
  sizing?: Sizing;
  assets: { printArea?: string }[];
}

export interface CreateQuoteRequest {
  shippingMethod?: ShippingMethod;
  destinationCountryCode: string;
  items: QuoteItem[];
  currencyCode?: string;
}

export interface QuoteCostItem {
  id?: string;
  sku: string;
  copies: number;
  unitCost: Cost;
  totalCost?: Cost;
  attributes?: Record<string, string>;
  assets?: { printArea?: string }[];
}

export interface QuoteShipment {
  carrier: { name: string; service: string };
  cost: Cost;
  items: string[];
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

export interface QuoteIssue {
  errorCode: string;
  description: string;
}

export interface QuoteOutcome {
  outcome: string;
  quotes: Quote[];
  issues?: QuoteIssue[];
  traceParent: string;
}
