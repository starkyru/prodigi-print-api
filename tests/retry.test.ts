import { describe, it, expect } from "vitest";
import {
  DEFAULT_RETRY_POLICY,
  computeBackoffDelay,
  isRetryableStatus,
  parseRetryAfter,
  resolveRetryPolicy,
  type RetryPolicy,
} from "../src/retry.js";

/** Fixed policy so every expected delay below is hand-computable. */
const policy: RetryPolicy = {
  maxAttempts: 5,
  initialDelayMs: 500,
  maxDelayMs: 8_000,
  maxRetryAfterMs: 30_000,
  jitter: false,
  retryNetworkErrors: true,
};

describe("resolveRetryPolicy", () => {
  it("returns the documented defaults when given nothing", () => {
    expect(resolveRetryPolicy()).toEqual({
      maxAttempts: 3,
      initialDelayMs: 500,
      maxDelayMs: 8_000,
      maxRetryAfterMs: 30_000,
      jitter: true,
      retryNetworkErrors: true,
    });
  });

  it("exposes the same defaults as DEFAULT_RETRY_POLICY", () => {
    expect(DEFAULT_RETRY_POLICY.maxAttempts).toBe(3);
    expect(DEFAULT_RETRY_POLICY.initialDelayMs).toBe(500);
    expect(DEFAULT_RETRY_POLICY.jitter).toBe(true);
  });

  it("overrides only the fields provided", () => {
    expect(resolveRetryPolicy({ maxAttempts: 7, jitter: false })).toEqual({
      maxAttempts: 7,
      initialDelayMs: 500,
      maxDelayMs: 8_000,
      maxRetryAfterMs: 30_000,
      jitter: false,
      retryNetworkErrors: true,
    });
  });

  it("treats an explicitly undefined field as unset", () => {
    expect(
      resolveRetryPolicy({ initialDelayMs: undefined }).initialDelayMs,
    ).toBe(500);
  });

  it("disables retries when given false", () => {
    expect(resolveRetryPolicy(false).maxAttempts).toBe(1);
  });

  it("clamps maxAttempts to at least 1", () => {
    expect(resolveRetryPolicy({ maxAttempts: 0 }).maxAttempts).toBe(1);
    expect(resolveRetryPolicy({ maxAttempts: -4 }).maxAttempts).toBe(1);
  });
});

describe("isRetryableStatus", () => {
  it("retries 429", () => {
    expect(isRetryableStatus(429)).toBe(true);
  });

  it("retries 500, 502, 503 and 504", () => {
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(502)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(504)).toBe(true);
  });

  it("does not retry 501, which is permanent", () => {
    expect(isRetryableStatus(501)).toBe(false);
  });

  it("does not retry 4xx other than 429", () => {
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(401)).toBe(false);
    expect(isRetryableStatus(404)).toBe(false);
    expect(isRetryableStatus(422)).toBe(false);
  });

  it("does not retry 2xx or 3xx", () => {
    expect(isRetryableStatus(200)).toBe(false);
    expect(isRetryableStatus(304)).toBe(false);
  });
});

describe("computeBackoffDelay", () => {
  it("doubles the delay each attempt when jitter is off", () => {
    expect(computeBackoffDelay(1, policy)).toBe(500);
    expect(computeBackoffDelay(2, policy)).toBe(1_000);
    expect(computeBackoffDelay(3, policy)).toBe(2_000);
    expect(computeBackoffDelay(4, policy)).toBe(4_000);
  });

  it("caps the delay at maxDelayMs", () => {
    expect(computeBackoffDelay(5, policy)).toBe(8_000);
    expect(computeBackoffDelay(9, policy)).toBe(8_000);
  });

  it("draws from the upper half of the window when jitter is on", () => {
    const jittered: RetryPolicy = { ...policy, jitter: true };

    // capped = 500 → 250 + random * 250
    expect(computeBackoffDelay(1, jittered, () => 0)).toBe(250);
    expect(computeBackoffDelay(1, jittered, () => 0.5)).toBe(375);
    expect(computeBackoffDelay(1, jittered, () => 1)).toBe(500);
  });

  it("never returns zero with jitter on, avoiding an instant replay", () => {
    const jittered: RetryPolicy = { ...policy, jitter: true };

    expect(computeBackoffDelay(1, jittered, () => 0)).toBeGreaterThan(0);
  });
});

describe("parseRetryAfter", () => {
  // 2024-01-15T10:30:00Z
  const noon = 1_705_314_600_000;

  it("returns null when the header is absent", () => {
    expect(parseRetryAfter(null, noon)).toBe(null);
  });

  it("returns null for an empty or unparseable header", () => {
    expect(parseRetryAfter("", noon)).toBe(null);
    expect(parseRetryAfter("   ", noon)).toBe(null);
    expect(parseRetryAfter("soon", noon)).toBe(null);
  });

  it("reads delta-seconds as milliseconds", () => {
    expect(parseRetryAfter("0", noon)).toBe(0);
    expect(parseRetryAfter("1", noon)).toBe(1_000);
    expect(parseRetryAfter("120", noon)).toBe(120_000);
  });

  it("reads an HTTP-date as the remaining wait", () => {
    expect(
      parseRetryAfter("Mon, 15 Jan 2024 10:30:00 GMT", noon - 60_000),
    ).toBe(60_000);
  });

  it("clamps an HTTP-date already in the past to zero", () => {
    expect(
      parseRetryAfter("Mon, 15 Jan 2024 10:30:00 GMT", noon + 60_000),
    ).toBe(0);
  });
});
