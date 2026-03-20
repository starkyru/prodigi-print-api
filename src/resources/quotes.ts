import type { HttpClient } from "../http.js";
import type { CreateQuoteRequest, QuoteOutcome } from "../types/index.js";

/** Resource for requesting shipping and cost quotes. */
export class QuotesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Request a quote for a potential order.
   * @param request - Quote request payload.
   * @returns The quote outcome with cost and shipping estimates.
   */
  async create(request: CreateQuoteRequest): Promise<QuoteOutcome> {
    return this.http.post<QuoteOutcome>("/quotes", request);
  }
}
