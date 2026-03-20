import type { HttpClient } from "../http.js";
import type {
  ProductOutcome,
  SpineRequest,
  SpineResponse,
} from "../types/index.js";

/** Resource for browsing the Prodigi product catalogue. */
export class ProductsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get product details by SKU.
   * @param sku - The product SKU.
   */
  async get(sku: string): Promise<ProductOutcome> {
    return this.http.get<ProductOutcome>(`/products/${sku}`);
  }

  /**
   * Calculate spine width for book-type products.
   * @param request - Spine calculation parameters.
   */
  async getSpine(request: SpineRequest): Promise<SpineResponse> {
    return this.http.post<SpineResponse>("/products/spine", request);
  }
}
