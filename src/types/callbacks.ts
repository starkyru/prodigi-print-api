import type { Order } from "./orders.js";

export interface CallbackEvent {
  specversion: string;
  type: string;
  source: string;
  id: string;
  time: string;
  datacontenttype: string;
  subject: string;
  data: Order;
}
