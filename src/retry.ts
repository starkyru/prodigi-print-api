/**
 * Retry policy for transient Prodigi API failures.
 *
 * Every field is optional; unset fields fall back to {@link DEFAULT_RETRY_POLICY}.
 */
export interface RetryOptions {
  /** Total attempts including the first, clamped to at least 1. Default `3`. */
  maxAttempts?: number;
  /** Base delay for the first retry, in milliseconds. Default `500`. */
  initialDelayMs?: number;
  /** Upper bound on the computed exponential delay, in milliseconds. Default `8000`. */
  maxDelayMs?: number;
  /**
   * Longest `Retry-After` value that will be waited out, in milliseconds.
   * A longer `Retry-After` aborts the retry and throws. Default `30000`.
   */
  maxRetryAfterMs?: number;
  /** Apply equal jitter to computed delays. Default `true`. */
  jitter?: boolean;
  /** Retry when `fetch` itself rejects (DNS failure, socket reset, ...). Default `true`. */
  retryNetworkErrors?: boolean;
}

/** A fully resolved {@link RetryOptions} with no unset fields. */
export type RetryPolicy = Required<RetryOptions>;

/** Defaults applied when a client is constructed without a `retry` option. */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 8_000,
  maxRetryAfterMs: 30_000,
  jitter: true,
  retryNetworkErrors: true,
};

/**
 * Fill in unset fields from {@link DEFAULT_RETRY_POLICY}.
 * @param options - Partial policy, or `false` to disable retries entirely.
 */
export function resolveRetryPolicy(
  options?: RetryOptions | false,
): RetryPolicy {
  if (options === false) {
    return { ...DEFAULT_RETRY_POLICY, maxAttempts: 1 };
  }

  return {
    maxAttempts: Math.max(
      1,
      Math.floor(options?.maxAttempts ?? DEFAULT_RETRY_POLICY.maxAttempts),
    ),
    initialDelayMs:
      options?.initialDelayMs ?? DEFAULT_RETRY_POLICY.initialDelayMs,
    maxDelayMs: options?.maxDelayMs ?? DEFAULT_RETRY_POLICY.maxDelayMs,
    maxRetryAfterMs:
      options?.maxRetryAfterMs ?? DEFAULT_RETRY_POLICY.maxRetryAfterMs,
    jitter: options?.jitter ?? DEFAULT_RETRY_POLICY.jitter,
    retryNetworkErrors:
      options?.retryNetworkErrors ?? DEFAULT_RETRY_POLICY.retryNetworkErrors,
  };
}

/**
 * Whether a response status is worth retrying.
 *
 * Covers `429 Too Many Requests` and the 5xx range. `501 Not Implemented` is
 * excluded — it is a permanent condition that will never succeed on replay.
 *
 * @param status - HTTP status code.
 */
export function isRetryableStatus(status: number): boolean {
  if (status === 429) return true;
  if (status === 501) return false;
  return status >= 500 && status <= 599;
}

/**
 * Exponential backoff with equal jitter.
 *
 * The undelayed delay doubles per attempt (`initialDelayMs * 2 ** (attempt - 1)`)
 * and is capped at `maxDelayMs`. With jitter enabled the returned delay is drawn
 * from the upper half of that window — `capped / 2 + random() * capped / 2` — which
 * spreads retries out without ever collapsing to zero.
 *
 * @param attempt - 1-based index of the attempt that just failed.
 * @param policy - Resolved retry policy.
 * @param random - Source of randomness in `[0, 1)`. Injectable for tests.
 */
export function computeBackoffDelay(
  attempt: number,
  policy: RetryPolicy,
  random: () => number = Math.random,
): number {
  const exponential = policy.initialDelayMs * 2 ** (attempt - 1);
  const capped = Math.min(exponential, policy.maxDelayMs);

  if (!policy.jitter) return capped;

  return Math.round(capped / 2 + random() * (capped / 2));
}

/**
 * Parse a `Retry-After` header into milliseconds.
 *
 * Accepts both forms allowed by RFC 9110: non-negative delta-seconds, and an
 * HTTP-date. Returns `null` when the header is absent or unparseable.
 *
 * @param value - Raw header value, or `null` when not present.
 * @param nowMs - Current epoch milliseconds, used to resolve the HTTP-date form.
 */
export function parseRetryAfter(
  value: string | null,
  nowMs: number,
): number | null {
  if (value === null) return null;

  const trimmed = value.trim();
  if (trimmed === "") return null;

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }

  const dateMs = Date.parse(trimmed);
  if (Number.isNaN(dateMs)) return null;

  return Math.max(0, dateMs - nowMs);
}
