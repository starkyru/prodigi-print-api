/**
 * Build a real `Response` for stubbing the fetch boundary.
 *
 * Uses the platform `Response` rather than a hand-rolled object literal so the
 * stub cannot drift from the contract `HttpClient` actually consumes.
 */
export function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  return new Response(JSON.stringify(data), { ...init, headers });
}

/** Build a real `Response` with a non-JSON body, e.g. a gateway error page. */
export function textResponse(body: string, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "text/html");

  return new Response(body, { ...init, headers });
}
