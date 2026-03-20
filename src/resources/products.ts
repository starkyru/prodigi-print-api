import type { HttpClient } from "../http.js";
import type {
  ListProductsParams,
  ListProductsResponse,
  ProductOutcome,
  SpineRequest,
  SpineResponse,
} from "../types/index.js";

export class ProductsResource {
  constructor(private readonly http: HttpClient) {}

  async get(sku: string): Promise<ProductOutcome> {
    return this.http.get<ProductOutcome>(`/products/${sku}`);
  }

  async list(params?: ListProductsParams): Promise<ListProductsResponse> {
    return this.http.get<ListProductsResponse>(
      "/products",
      params as Record<string, unknown>,
    );
  }

  async getSpine(request: SpineRequest): Promise<SpineResponse> {
    return this.http.post<SpineResponse>("/products/spine", request);
  }
}
