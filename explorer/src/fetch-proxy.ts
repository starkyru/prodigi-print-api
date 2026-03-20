const SANDBOX_ORIGIN = "https://api.sandbox.prodigi.com/v4.0";
const PRODUCTION_ORIGIN = "https://api.prodigi.com/v4.0";

const originalFetch = globalThis.fetch;

/**
 * Monkey-patches globalThis.fetch so that requests to the Prodigi API
 * are rewritten to go through Vite's dev-server proxy, avoiding CORS.
 */
export function installFetchProxy(): void {
  globalThis.fetch = (input, init) => {
    if (typeof input === "string") {
      if (input.startsWith(SANDBOX_ORIGIN)) {
        input = "/api/sandbox" + input.slice(SANDBOX_ORIGIN.length);
      } else if (input.startsWith(PRODUCTION_ORIGIN)) {
        input = "/api/production" + input.slice(PRODUCTION_ORIGIN.length);
      }
    } else if (input instanceof Request) {
      let url = input.url;
      let rewritten = false;
      if (url.startsWith(SANDBOX_ORIGIN)) {
        url = "/api/sandbox" + url.slice(SANDBOX_ORIGIN.length);
        rewritten = true;
      } else if (url.startsWith(PRODUCTION_ORIGIN)) {
        url = "/api/production" + url.slice(PRODUCTION_ORIGIN.length);
        rewritten = true;
      }
      if (rewritten) {
        input = new Request(url, input);
      }
    }
    return originalFetch(input, init);
  };
}
