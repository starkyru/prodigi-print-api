import type { HttpClient } from "../http.js";
import type {
  CatalogueListResponse,
  CatalogueProductDetail,
} from "../types/index.js";

/** Resource for browsing the public Prodigi product catalogue (no authentication required). */
export class CatalogueResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all categories and products in the catalogue.
   * @returns The full category tree.
   */
  async list(): Promise<CatalogueListResponse> {
    return this.http.get<CatalogueListResponse>("/catalogue");
  }

  /**
   * Get detailed product information including SKU variants, sizes, and pricing.
   * @param slug - The product slug (e.g. "cold-press-watercolour-paper").
   */
  async get(slug: string): Promise<CatalogueProductDetail> {
    return this.http.get<CatalogueProductDetail>(`/catalogue/${slug}`);
  }
}
