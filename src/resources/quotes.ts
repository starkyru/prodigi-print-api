import type { HttpClient } from "../http.js";
import type { CreateQuoteRequest, QuoteOutcome } from "../types/index.js";

export class QuotesResource {
  constructor(private readonly http: HttpClient) {}

  async create(request: CreateQuoteRequest): Promise<QuoteOutcome> {
    return this.http.post<QuoteOutcome>("/quotes", request);
  }
}
