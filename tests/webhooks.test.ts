import { describe, it, expect } from "vitest";
import { isCallbackEvent, parseCallbackEvent } from "../src/webhooks.js";
import { ProdigiWebhookError } from "../src/errors.js";

/** Envelope taken from the Prodigi callbacks reference, trimmed to the fields the SDK reads. */
const stageChangedPayload = {
  specversion: "1.0",
  type: "com.prodigi.order.status.stage.changed#InProgress",
  source: "https://api.sandbox.prodigi.com/v4.0/Orders/",
  id: "evt_305174",
  time: "2020-08-14T11:51:01.55Z",
  datacontenttype: "application/json",
  subject: "ord_1469466",
  data: {
    order: {
      id: "ord_1469466",
      created: "2020-08-14T11:50:54.557Z",
      status: {
        stage: "InProgress",
        issues: [],
        details: {
          downloadAssets: "InProgress",
          printReadyAssetsPrepared: "NotStarted",
          allocateProductionLocation: "NotStarted",
          inProduction: "NotStarted",
          shipping: "NotStarted",
        },
      },
    },
  },
};

/** Deep clone so a test mutating the fixture cannot leak into the next one. */
function payload(overrides: Record<string, unknown> = {}): unknown {
  return {
    ...structuredClone(stageChangedPayload),
    ...overrides,
  };
}

describe("isCallbackEvent", () => {
  it("accepts a well-formed envelope", () => {
    expect(isCallbackEvent(payload())).toBe(true);
  });

  it("rejects non-objects", () => {
    expect(isCallbackEvent(null)).toBe(false);
    expect(isCallbackEvent(undefined)).toBe(false);
    expect(isCallbackEvent("evt_305174")).toBe(false);
    expect(isCallbackEvent(42)).toBe(false);
    expect(isCallbackEvent([])).toBe(false);
  });

  it("rejects an envelope missing a required CloudEvents attribute", () => {
    expect(isCallbackEvent(payload({ specversion: undefined }))).toBe(false);
    expect(isCallbackEvent(payload({ type: undefined }))).toBe(false);
    expect(isCallbackEvent(payload({ source: undefined }))).toBe(false);
    expect(isCallbackEvent(payload({ id: undefined }))).toBe(false);
    expect(isCallbackEvent(payload({ time: undefined }))).toBe(false);
    expect(isCallbackEvent(payload({ datacontenttype: undefined }))).toBe(
      false,
    );
    expect(isCallbackEvent(payload({ subject: undefined }))).toBe(false);
  });

  it("rejects an empty-string attribute", () => {
    expect(isCallbackEvent(payload({ id: "" }))).toBe(false);
  });

  it("rejects a payload with no order", () => {
    expect(isCallbackEvent(payload({ data: {} }))).toBe(false);
    expect(isCallbackEvent(payload({ data: { order: null } }))).toBe(false);
    expect(isCallbackEvent(payload({ data: { order: { id: "" } } }))).toBe(
      false,
    );
  });
});

describe("parseCallbackEvent", () => {
  it("parses a stage change into the typed event", () => {
    const event = parseCallbackEvent(payload());

    expect(event.kind).toBe("order.status.stage.changed");
    expect(event.eventType).toBe("com.prodigi.order.status.stage.changed");
    expect(event.changedTo).toBe("InProgress");
    expect(event.id).toBe("evt_305174");
    expect(event.subject).toBe("ord_1469466");
    expect(event.time).toBe("2020-08-14T11:51:01.55Z");
    expect(event.order.id).toBe("ord_1469466");
    expect(event.order.status.stage).toBe("InProgress");
  });

  it("accepts a raw JSON string body", () => {
    const event = parseCallbackEvent(JSON.stringify(stageChangedPayload));

    expect(event.kind).toBe("order.status.stage.changed");
    expect(event.subject).toBe("ord_1469466");
  });

  it("exposes the untouched envelope", () => {
    const input = payload();
    const event = parseCallbackEvent(input);

    expect(event.event).toEqual(input);
  });

  it("classifies a shipment event", () => {
    const event = parseCallbackEvent(
      payload({ type: "com.prodigi.order.shipments.shipment#Shipped" }),
    );

    expect(event.kind).toBe("order.shipments.shipment");
    expect(event.eventType).toBe("com.prodigi.order.shipments.shipment");
    expect(event.changedTo).toBe("Shipped");
  });

  it("falls back to unknown for an unrecognised type rather than throwing", () => {
    const event = parseCallbackEvent(
      payload({ type: "com.prodigi.order.something.new#Whatever" }),
    );

    expect(event.kind).toBe("unknown");
    expect(event.eventType).toBe("com.prodigi.order.something.new");
    expect(event.changedTo).toBe("Whatever");
  });

  it("reports an empty changedTo when the type carries no fragment", () => {
    const event = parseCallbackEvent(
      payload({ type: "com.prodigi.order.status.stage.changed" }),
    );

    expect(event.kind).toBe("order.status.stage.changed");
    expect(event.changedTo).toBe("");
  });

  it("keeps only the first # as the fragment separator", () => {
    const event = parseCallbackEvent(
      payload({ type: "com.prodigi.order.status.stage.changed#A#B" }),
    );

    expect(event.eventType).toBe("com.prodigi.order.status.stage.changed");
    expect(event.changedTo).toBe("A#B");
  });

  it("narrows to the stage-changed member in a switch", () => {
    const event = parseCallbackEvent(payload());

    switch (event.kind) {
      case "order.status.stage.changed":
        expect(event.order.status.stage).toBe("InProgress");
        break;
      default:
        expect.fail(`Expected a stage change, got ${event.kind}`);
    }
  });

  it("throws ProdigiWebhookError on a non-JSON string body", () => {
    expect(() => parseCallbackEvent("<html>nope</html>")).toThrow(
      ProdigiWebhookError,
    );
    expect(() => parseCallbackEvent("<html>nope</html>")).toThrow(
      "Callback body is not valid JSON",
    );
  });

  it("throws ProdigiWebhookError on a structurally invalid payload", () => {
    expect(() => parseCallbackEvent({ hello: "world" })).toThrow(
      ProdigiWebhookError,
    );
    expect(() => parseCallbackEvent({ hello: "world" })).toThrow(
      "Payload is not a valid Prodigi callback event",
    );
  });

  it("attaches the rejected payload to the error", () => {
    try {
      parseCallbackEvent({ hello: "world" });
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ProdigiWebhookError);
      expect((err as ProdigiWebhookError).payload).toEqual({ hello: "world" });
    }
  });
});
