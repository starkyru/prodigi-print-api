export interface CataloguePricing {
  source: string;
  value: string;
}

export interface CatalogueProductSummary {
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

export interface CatalogueCategory {
  name: string;
  slug: string;
  fullSlug?: string;
  images?: string[];
  products: Record<string, CatalogueProductSummary>;
  subCategories: Record<string, CatalogueCategory>;
}

/** Response from `GET /api/catalogue` — a map of top-level category slugs to categories. */
export type CatalogueListResponse = Record<string, CatalogueCategory>;

export interface CatalogueVariantAsset {
  name: string;
  required: boolean;
  horizontalInches: number;
  verticalInches: number;
  sizeUnits: string;
  outputDpi: number;
  fileOutputFormat: string;
}

export interface CatalogueVariantAttribute {
  value: string[];
}

export interface CatalogueVariantRow {
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

export interface CatalogueVariantColumn {
  enableSorting: boolean;
  name: string;
  filterType: string;
  options?: string[];
}

export interface CatalogueVariants {
  columns: Record<string, CatalogueVariantColumn>;
  rows: CatalogueVariantRow[];
}

export interface CatalogueManufacturing {
  regions: string[];
  time: string;
  shipsTo: string[];
}

export interface CatalogueProductDetail {
  name: string;
  availability: string;
  description: string[];
  features: string[];
  manufacturing: CatalogueManufacturing;
  pricing: CataloguePricing[];
  variants: CatalogueVariants;
  sizes: string[];
}
