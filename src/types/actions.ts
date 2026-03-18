import type { Recipient, ShippingMethod } from "./common.js";

export interface OrderAction {
  action: string;
  isAvailable: boolean;
}

export interface OrderActions {
  actions: OrderAction[];
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

export interface ActionOutcome {
  outcome: string;
  traceParent: string;
}
