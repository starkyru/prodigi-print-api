import type { Order } from "./orders.js";
import type { Recipient, ShippingMethod } from "./common.js";

export interface ActionAvailability {
  isAvailable: string;
}

export interface OrderActions {
  outcome: string;
  cancel: ActionAvailability;
  changeRecipientDetails: ActionAvailability;
  changeShippingMethod: ActionAvailability;
  changeMetaData: ActionAvailability;
  traceParent: string;
}

export interface UpdateShippingMethodRequest {
  shippingMethod: ShippingMethod;
}

export interface UpdateRecipientRequest {
  recipient: Recipient;
}

export interface UpdateMetadataRequest {
  metadata: Record<string, string>;
}

export interface ShipmentUpdateResult {
  shipmentId: string;
  successful: boolean;
  errorMessage?: string;
}

export interface ActionOutcome {
  outcome: string;
  order: Order;
  traceParent: string;
}

export interface ShippingActionOutcome extends ActionOutcome {
  shipmentUpdateResults?: ShipmentUpdateResult[];
}

export interface RecipientActionOutcome extends ActionOutcome {
  shippingUpdateResults?: ShipmentUpdateResult[];
}
