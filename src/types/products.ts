export interface PrintAreaSize {
  horizontalResolution: number;
  verticalResolution: number;
}

export interface Variant {
  attributes: Record<string, string>;
  shipsTo: string[];
  printAreaSizes: Record<string, PrintAreaSize>;
}

export interface Product {
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

export interface ProductOutcome {
  outcome: string;
  product: Product;
  traceParent: string;
}

export interface SpineRequest {
  sku: string;
  destinationCountryCode: string;
  state?: string;
  numberOfPages: number;
}

export interface SpineResponse {
  success: boolean;
  message: string;
  spineInfo: {
    widthMm: number;
  };
}
