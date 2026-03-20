import { HttpClient } from "./http.js";
import { OrdersResource } from "./resources/orders.js";
import { QuotesResource } from "./resources/quotes.js";
import { ProductsResource } from "./resources/products.js";

const SANDBOX_URL = "https://api.sandbox.prodigi.com/v4.0";
const PRODUCTION_URL = "https://api.prodigi.com/v4.0";

export type Environment = "sandbox" | "production";

export interface ProdigiClientOptions {
  apiKey: string;
  environment?: Environment;
}

/**
 * Main client for interacting with the Prodigi API.
 *
 * @example
 * ```ts
 * const client = new ProdigiClient({
 *   apiKey: "your-api-key",
 *   environment: "sandbox",
 * });
 *
 * const order = await client.orders.create(request);
 * ```
 */
export class ProdigiClient {
  readonly orders: OrdersResource;
  readonly quotes: QuotesResource;
  readonly products: ProductsResource;
  readonly environment: Environment;

  private readonly apiKey: string;

  /**
   * @param options - Client configuration including API key and optional environment.
   */
  constructor(options: ProdigiClientOptions) {
    this.apiKey = options.apiKey;
    this.environment = options.environment ?? "sandbox";

    const baseUrl =
      this.environment === "production" ? PRODUCTION_URL : SANDBOX_URL;

    const http = new HttpClient({ baseUrl, apiKey: this.apiKey });

    this.orders = new OrdersResource(http);
    this.quotes = new QuotesResource(http);
    this.products = new ProductsResource(http);
  }
}
