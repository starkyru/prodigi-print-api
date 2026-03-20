import { ProdigiApiError } from "./errors.js";

export interface HttpClientOptions {
  baseUrl: string;
  apiKey?: string;
}

/** Low-level HTTP client for making authenticated requests to the Prodigi API. */
export class HttpClient {
  readonly baseUrl: string;
  private readonly apiKey: string | undefined;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
  }

  /**
   * Send a GET request.
   * @param path - API endpoint path (e.g. "/orders").
   * @param query - Optional query parameters appended to the URL.
   */
  async get<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    const url = this.buildUrl(path, query);
    return this.request<T>(url, { method: "GET" });
  }

  /**
   * Send a POST request.
   * @param path - API endpoint path (e.g. "/orders").
   * @param body - Optional JSON-serializable request body.
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    const url = new URL(`${this.baseUrl}${path}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;

        if (Array.isArray(value)) {
          for (const item of value) {
            url.searchParams.append(key, String(item));
          }
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }

    const response = await globalThis.fetch(url, {
      ...init,
      headers,
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      const traceParent = response.headers.get("traceparent");
      const message =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof (data as Record<string, unknown>).message === "string"
          ? (data as Record<string, string>).message
          : `API error: ${response.status}`;

      throw new ProdigiApiError(message, response.status, traceParent, data);
    }

    return data as T;
  }
}
