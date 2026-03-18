export interface PrintArea {
  name: string;
  required: boolean;
}

export interface VariantAttribute {
  name: string;
  value: string;
}

export interface Variant {
  attributes: VariantAttribute[];
  shipsTo: string[];
  printAreaSizes: Record<string, { widthMm: number; heightMm: number }>;
}

export interface Product {
  sku: string;
  description: string;
  productDimensions?: {
    width: number;
    height: number;
    units: string;
  };
  variants: Variant[];
  printAreas: PrintArea[];
}

export interface ProductOutcome {
  outcome: string;
  product: Product;
}

export interface SpineRequest {
  sku: string;
  pageCount: number;
}

export interface SpineResponse {
  outcome: string;
  spineWidthMm: number;
}
