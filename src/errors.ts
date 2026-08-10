/** Base error class for all Prodigi SDK errors. */
export class ProdigiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProdigiError";
  }
}

/** Error thrown when the Prodigi API returns a non-OK HTTP response. */
export class ProdigiApiError extends ProdigiError {
  readonly statusCode: number;
  readonly traceParent: string | null;
  readonly data: unknown;

  /**
   * @param message - Human-readable error message from the API.
   * @param statusCode - HTTP status code of the response.
   * @param traceParent - Trace parent header for request tracing, if present.
   * @param data - Raw response body from the API.
   */
  constructor(
    message: string,
    statusCode: number,
    traceParent: string | null,
    data: unknown,
  ) {
    super(message);
    this.name = "ProdigiApiError";
    this.statusCode = statusCode;
    this.traceParent = traceParent;
    this.data = data;
  }
}

/** Error thrown when an incoming callback payload is not a valid Prodigi event. */
export class ProdigiWebhookError extends ProdigiError {
  /** The payload that failed validation, as received. */
  readonly payload: unknown;

  /**
   * @param message - Why the payload was rejected.
   * @param payload - The rejected payload, for logging.
   */
  constructor(message: string, payload: unknown) {
    super(message);
    this.name = "ProdigiWebhookError";
    this.payload = payload;
  }
}
