# Changelog

## 1.3.0

Completes coverage of the Prodigi Print API v4.0.

### Added

- **`client.orders.list(params?)`** — `GET /orders` with the full documented filter set: `top`, `skip`, `createdFrom`, `createdTo`, `status`, `orderIds`, `merchantReferences`. `createdFrom`/`createdTo` accept a `Date` as well as an ISO 8601 string.
- **Webhook helpers** — `parseCallbackEvent(payload)` validates an incoming Prodigi callback and returns a discriminated union (`ProdigiCallbackEvent`) keyed on `kind`. `isCallbackEvent(payload)` is exported as a standalone type guard. New `ProdigiWebhookError` carries the rejected payload.
- **Retry and rate-limit handling** — 429, 5xx (except the permanent 501) and `fetch`-level network errors are retried with exponential backoff and equal jitter. `Retry-After` is honoured in both the delta-seconds and HTTP-date forms. Configurable via `ProdigiClientOptions.retry`, or `retry: false` to opt out. Defaults to 3 attempts starting at 500 ms, capped at 8 s.
- **Scheduled sandbox e2e workflow** (`.github/workflows/e2e.yml`) — runs daily to catch contract drift with Prodigi. Skips cleanly (green) when the optional `PRODIGI_SANDBOX_API_KEY` secret is absent.
- New exported types: `OrderListStatus`, `ListOrdersParams`, `ListOrdersResponse`, `CallbackEventData`, `CallbackEventBase`, `ProdigiCallbackEvent`, `OrderStageChangedEvent`, `OrderShipmentEvent`, `UnknownCallbackEvent`, `RetryOptions`, `RetryPolicy`, and the `DEFAULT_RETRY_POLICY` constant.

### Changed (breaking, types only)

- **`CallbackEvent.data` is now `CallbackEventData` (`{ order: Order }`), not `Order`.** Prodigi wraps the order in a `data.order` object. Code reading `event.data.id` was already getting `undefined` at runtime; it now fails to compile. Read `event.data.order.id`, or use `parseCallbackEvent()` and read `event.order.id`.

`orders.create()` is unaffected at runtime but is now only replayed on a transient failure when the request carries an `idempotencyKey` — without one, a replay could create a duplicate order.

### Fixed

- Response bodies are read as text and then parsed instead of calling `response.json()` unconditionally. A non-JSON error body (an HTML 502 page) or an empty body previously threw a `SyntaxError` rather than a `ProdigiApiError`, and would also have defeated 5xx retries. `ProdigiApiError.data` now holds the raw string when the body is not JSON.
- `API.md` documented `client.products.list()` with `ListProductsParams` / `ListProductsResponse`. No such method exists in this SDK, and Prodigi v4 has no list-products endpoint — only `GET /products/{sku}` and `POST /products/spine`. Removed.
- `README.md` claimed an `NPM_TOKEN` secret is required; publishing uses npm OIDC trusted publishing.
- ESLint's `dist` ignore is anchored with `**/`, so the explorer's local build output no longer makes `npm run lint` fail locally while passing in CI.

### Notes

Prodigi does **not** sign callbacks — the v4.0 API provides no signature header, shared secret, or other authentication mechanism. `parseCallbackEvent()` validates shape only and cannot establish authenticity. See the README for the recommended mitigations.

## 1.2.6 and earlier

See the git history.
