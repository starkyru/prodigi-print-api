import type { HttpClient } from "../http.js";
import type {
  ActionOutcome,
  CreateOrderRequest,
  OrderActions,
  OrderOutcome,
  RecipientActionOutcome,
  ShippingActionOutcome,
  UpdateMetadataRequest,
  UpdateRecipientRequest,
  UpdateShippingMethodRequest,
} from "../types/index.js";

/** Resource for managing Prodigi print orders. */
export class OrdersResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Submit a new order.
   * @param request - Order creation payload.
   * @returns The created order outcome.
   */
  async create(request: CreateOrderRequest): Promise<OrderOutcome> {
    return this.http.post<OrderOutcome>("/orders", request);
  }

  /**
   * Fetch a single order by ID.
   * @param orderId - The Prodigi order ID.
   */
  async get(orderId: string): Promise<OrderOutcome> {
    return this.http.get<OrderOutcome>(`/orders/${orderId}`);
  }

  /**
   * Get available actions for an order.
   * @param orderId - The Prodigi order ID.
   */
  async getActions(orderId: string): Promise<OrderActions> {
    return this.http.get<OrderActions>(`/orders/${orderId}/actions`);
  }

  /**
   * Cancel an order.
   * @param orderId - The Prodigi order ID.
   */
  async cancel(orderId: string): Promise<ActionOutcome> {
    return this.http.post<ActionOutcome>(`/orders/${orderId}/actions/cancel`);
  }

  /**
   * Update the shipping method for an order.
   * @param orderId - The Prodigi order ID.
   * @param request - New shipping method details.
   */
  async updateShippingMethod(
    orderId: string,
    request: UpdateShippingMethodRequest,
  ): Promise<ShippingActionOutcome> {
    return this.http.post<ShippingActionOutcome>(
      `/orders/${orderId}/actions/updateShippingMethod`,
      request,
    );
  }

  /**
   * Update the recipient for an order.
   * @param orderId - The Prodigi order ID.
   * @param request - New recipient details.
   */
  async updateRecipient(
    orderId: string,
    request: UpdateRecipientRequest,
  ): Promise<RecipientActionOutcome> {
    return this.http.post<RecipientActionOutcome>(
      `/orders/${orderId}/actions/updateRecipient`,
      request.recipient,
    );
  }

  /**
   * Update metadata on an order.
   * @param orderId - The Prodigi order ID.
   * @param request - New metadata key-value pairs.
   */
  async updateMetadata(
    orderId: string,
    request: UpdateMetadataRequest,
  ): Promise<ActionOutcome> {
    return this.http.post<ActionOutcome>(
      `/orders/${orderId}/actions/updateMetadata`,
      request,
    );
  }
}
