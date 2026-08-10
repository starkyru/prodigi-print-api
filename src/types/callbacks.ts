import type { Order } from "./orders.js";

/** Payload of a Prodigi callback: the order at the moment the event was created. */
export interface CallbackEventData {
  order: Order;
}

/**
 * Raw CloudEvents v1.0 envelope as delivered by Prodigi.
 *
 * @see https://www.prodigi.com/print-api/docs/reference/#callbacks
 */
export interface CallbackEvent {
  /** CloudEvents spec version, e.g. `"1.0"`. */
  specversion: string;
  /** Reverse-DNS event type with a `#fragment` new value, e.g. `"com.prodigi.order.status.stage.changed#InProgress"`. */
  type: string;
  /** URI of the environment that produced the event, e.g. `"https://api.prodigi.com/v4.0/Orders/"`. */
  source: string;
  /** Unique event id, prefixed `evt_`. */
  id: string;
  /** RFC 3339 timestamp of when the event was generated. */
  time: string;
  /** Always `"application/json"`. */
  datacontenttype: string;
  /** The object that produced the callback — the order id. */
  subject: string;
  data: CallbackEventData;
}

/**
 * CloudEvents `type` Prodigi sends when an order changes fulfilment stage.
 *
 * Documented verbatim in the Prodigi reference.
 */
export const ORDER_STAGE_CHANGED_TYPE =
  "com.prodigi.order.status.stage.changed";

/**
 * CloudEvents `type` prefix for shipment callbacks.
 *
 * Prodigi documents that callbacks fire "when a shipment is made" and that the
 * `type` is built from the path to the nested object, but does not publish the
 * literal string. This prefix follows that documented convention; anything that
 * does not match still parses, as an {@link UnknownCallbackEvent}.
 */
export const ORDER_SHIPMENT_TYPE_PREFIX = "com.prodigi.order.shipments";

/** Fields shared by every parsed callback event. */
export interface CallbackEventBase {
  /** The raw envelope exactly as delivered, for logging or replay. */
  event: CallbackEvent;
  /** Unique event id, prefixed `evt_`. */
  id: string;
  /** Order id the callback relates to (CloudEvents `subject`). */
  subject: string;
  /** RFC 3339 timestamp of when the event was generated. */
  time: string;
  /** The order carried by the callback. */
  order: Order;
  /** CloudEvents `type` with the `#fragment` stripped. */
  eventType: string;
  /** Value after `#` in the CloudEvents `type`, e.g. `"InProgress"`. Empty when absent. */
  changedTo: string;
}

/**
 * An order moved between fulfilment stages.
 *
 * `changedTo` carries the raw fragment; `order.status.stage` carries the same
 * value already narrowed to {@link OrderStage}.
 */
export interface OrderStageChangedEvent extends CallbackEventBase {
  kind: "order.status.stage.changed";
}

/** A shipment was made against the order. */
export interface OrderShipmentEvent extends CallbackEventBase {
  kind: "order.shipments.shipment";
}

/**
 * A structurally valid callback whose `type` this SDK does not recognise.
 *
 * Newer Prodigi event types land here rather than throwing, so a handler keeps
 * working when Prodigi adds events. Inspect `eventType` and `event` directly.
 */
export interface UnknownCallbackEvent extends CallbackEventBase {
  kind: "unknown";
}

/** Discriminated union of parsed Prodigi callbacks, keyed on `kind`. */
export type ProdigiCallbackEvent =
  | OrderStageChangedEvent
  | OrderShipmentEvent
  | UnknownCallbackEvent;
