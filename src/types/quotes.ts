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
  carrier: string;
  cost: Cost;
  items: { sku: string }[];
}

export interface Quote {
  costSummary: {
    items: Cost;
    shipping: Cost;
    totalBeforeTax: Cost;
    totalTax: Cost;
    total: Cost;
  };
  items: QuoteCostItem[];
  shipments: QuoteShipment[];
}

export interface QuoteOutcome {
  outcome: string;
  quotes: Quote[];
}
