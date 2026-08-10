import { ProdigiApiError } from "./errors.js";
import {
  computeBackoffDelay,
  isRetryableStatus,
  parseRetryAfter,
  resolveRetryPolicy,
  type RetryOptions,
  type RetryPolicy,
} from "./retry.js";

export interface HttpClientOptions {
  baseUrl: string;
  apiKey?: string;
  /** Retry policy for transient failures, or `false` to disable retries. */
  retry?: RetryOptions | false;
}

export interface RequestOptions {
  /**
   * Marks a non-idempotent method as safe to replay, e.g. because the payload
   * carries an idempotency key. Ignored for `GET`, which is always retryable.
   */
  idempotent?: boolean;
}

/** Read a response body once, tolerating empty and non-JSON payloads. */
async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === "") return null;

  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    return text;
  }
}

/** Pull an error message out of a parsed error body, falling back to the status. */
function errorMessage(data: unknown, status: number): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof (data as Record<string, unknown>).message === "string"
  ) {
    return (data as Record<string, string>).message;
  }

  return `API error: ${status}`;
}

/** Low-level HTTP client for making authenticated requests to the Prodigi API. */
export class HttpClient {
  readonly baseUrl: string;
  readonly retryPolicy: RetryPolicy;
  private readonly apiKey: string | undefined;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
    this.retryPolicy = resolveRetryPolicy(options.retry);
  }

  /**
   * Send a GET request. Retried automatically on transient failures.
   * @param path - API endpoint path (e.g. "/orders").
   * @param query - Optional query parameters appended to the URL.
   */
  async get<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    const url = this.buildUrl(path, query);
    return this.request<T>(url, { method: "GET" }, true);
  }

  /**
   * Send a POST request.
   *
   * Not retried by default — a replayed POST can duplicate a side effect. Pass
   * `{ idempotent: true }` only when the payload makes replay safe.
   *
   * @param path - API endpoint path (e.g. "/orders").
   * @param body - Optional JSON-serializable request body.
   * @param options - Per-request overrides.
   */
  async post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(
      url,
      {
        method: "POST",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      options?.idempotent === true,
    );
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

  private async request<T>(
    url: string,
    init: RequestInit,
    retryable: boolean,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }

    const policy = this.retryPolicy;
    const maxAttempts = retryable ? policy.maxAttempts : 1;

    for (let attempt = 1; ; attempt++) {
      let response: Response;

      try {
        response = await globalThis.fetch(url, { ...init, headers });
      } catch (cause) {
        if (attempt >= maxAttempts || !policy.retryNetworkErrors) throw cause;
        await sleep(computeBackoffDelay(attempt, policy));
        continue;
      }

      const data = await readBody(response);

      if (response.ok) {
        return data as T;
      }

      const delayMs =
        attempt < maxAttempts && isRetryableStatus(response.status)
          ? this.retryDelayFor(response, attempt)
          : null;

      if (delayMs === null) {
        throw new ProdigiApiError(
          errorMessage(data, response.status),
          response.status,
          response.headers.get("traceparent"),
          data,
        );
      }

      await sleep(delayMs);
    }
  }

  /**
   * Delay before replaying a retryable error response, or `null` to give up.
   *
   * A `Retry-After` header wins over the computed backoff, but only up to
   * `maxRetryAfterMs` — beyond that the caller is better served by an error than
   * by a silent multi-minute stall.
   */
  private retryDelayFor(response: Response, attempt: number): number | null {
    const retryAfterMs = parseRetryAfter(
      response.headers.get("retry-after"),
      Date.now(),
    );

    if (retryAfterMs === null) {
      return computeBackoffDelay(attempt, this.retryPolicy);
    }

    return retryAfterMs > this.retryPolicy.maxRetryAfterMs
      ? null
      : retryAfterMs;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
