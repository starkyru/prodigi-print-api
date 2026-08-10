import { ProdigiWebhookError } from "./errors.js";
import {
  ORDER_SHIPMENT_TYPE_PREFIX,
  ORDER_STAGE_CHANGED_TYPE,
  type CallbackEvent,
  type ProdigiCallbackEvent,
} from "./types/callbacks.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Structural type guard for a Prodigi callback envelope.
 *
 * Checks the CloudEvents envelope and that `data.order.id` is present. It does
 * not deep-validate the order — Prodigi may add fields at any time.
 *
 * This is a shape check, **not** an authenticity check. See
 * {@link parseCallbackEvent} for why.
 *
 * @param payload - Parsed JSON body of the callback request.
 */
export function isCallbackEvent(payload: unknown): payload is CallbackEvent {
  if (!isRecord(payload)) return false;

  if (!isNonEmptyString(payload.specversion)) return false;
  if (!isNonEmptyString(payload.type)) return false;
  if (!isNonEmptyString(payload.source)) return false;
  if (!isNonEmptyString(payload.id)) return false;
  if (!isNonEmptyString(payload.time)) return false;
  if (!isNonEmptyString(payload.datacontenttype)) return false;
  if (!isNonEmptyString(payload.subject)) return false;

  const data = payload.data;
  if (!isRecord(data)) return false;

  const order = data.order;
  if (!isRecord(order)) return false;

  return isNonEmptyString(order.id);
}

/** Split a CloudEvents `type` into its base type and `#fragment`. */
function splitType(type: string): { eventType: string; changedTo: string } {
  const index = type.indexOf("#");

  if (index === -1) return { eventType: type, changedTo: "" };

  return {
    eventType: type.slice(0, index),
    changedTo: type.slice(index + 1),
  };
}

function parseJson(text: string): unknown {
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    throw new ProdigiWebhookError("Callback body is not valid JSON", text);
  }
}

/**
 * Validate an incoming Prodigi callback and parse it into a typed event.
 *
 * ## Authenticity
 *
 * Prodigi does **not** sign callbacks. There is no signature header, shared
 * secret, or other authentication mechanism in the v4.0 API, so this function
 * cannot and does not verify that a request genuinely came from Prodigi — it
 * validates shape only. Protect your endpoint by treating the callback URL
 * itself as the secret (a long unguessable path) and, before acting on
 * anything that matters, re-reading the order with
 * `client.orders.get(event.subject)`.
 *
 * @param payload - The request body, either a JSON string or already-parsed JSON.
 * @returns A discriminated union member keyed on `kind`.
 * @throws {ProdigiWebhookError} If the body is not JSON, or not a Prodigi callback envelope.
 *
 * @example
 * ```ts
 * const event = parseCallbackEvent(await request.text());
 *
 * switch (event.kind) {
 *   case "order.status.stage.changed":
 *     console.log(event.subject, event.order.status.stage);
 *     break;
 *   case "order.shipments.shipment":
 *     console.log(event.order.shipments);
 *     break;
 *   case "unknown":
 *     console.log("unhandled event", event.eventType);
 *     break;
 * }
 * ```
 */
export function parseCallbackEvent(payload: unknown): ProdigiCallbackEvent {
  const raw = typeof payload === "string" ? parseJson(payload) : payload;

  if (!isCallbackEvent(raw)) {
    throw new ProdigiWebhookError(
      "Payload is not a valid Prodigi callback event",
      raw,
    );
  }

  const { eventType, changedTo } = splitType(raw.type);

  const base = {
    event: raw,
    id: raw.id,
    subject: raw.subject,
    time: raw.time,
    order: raw.data.order,
    eventType,
    changedTo,
  };

  if (eventType === ORDER_STAGE_CHANGED_TYPE) {
    return { ...base, kind: "order.status.stage.changed" };
  }

  if (eventType.startsWith(ORDER_SHIPMENT_TYPE_PREFIX)) {
    return { ...base, kind: "order.shipments.shipment" };
  }

  return { ...base, kind: "unknown" };
}
