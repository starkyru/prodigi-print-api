import type { HttpClient } from "../http.js";
import type {
  ActionOutcome,
  CreateOrderRequest,
  ListOrdersParams,
  ListOrdersResponse,
  OrderActions,
  OrderOutcome,
  RecipientActionOutcome,
  ShippingActionOutcome,
  UpdateMetadataRequest,
  UpdateRecipientRequest,
  UpdateShippingMethodRequest,
} from "../types/index.js";

export class OrdersResource {
  constructor(private readonly http: HttpClient) {}

  async create(request: CreateOrderRequest): Promise<OrderOutcome> {
    return this.http.post<OrderOutcome>("/orders", request);
  }

  async get(orderId: string): Promise<OrderOutcome> {
    return this.http.get<OrderOutcome>(`/orders/${orderId}`);
  }

  async list(params?: ListOrdersParams): Promise<ListOrdersResponse> {
    return this.http.get<ListOrdersResponse>(
      "/orders",
      params as Record<string, unknown>,
    );
  }

  async getActions(orderId: string): Promise<OrderActions> {
    return this.http.get<OrderActions>(`/orders/${orderId}/actions`);
  }

  async cancel(orderId: string): Promise<ActionOutcome> {
    return this.http.post<ActionOutcome>(`/orders/${orderId}/actions/cancel`);
  }

  async updateShippingMethod(
    orderId: string,
    request: UpdateShippingMethodRequest,
  ): Promise<ShippingActionOutcome> {
    return this.http.post<ShippingActionOutcome>(
      `/orders/${orderId}/actions/updateShippingMethod`,
      request,
    );
  }

  async updateRecipient(
    orderId: string,
    request: UpdateRecipientRequest,
  ): Promise<RecipientActionOutcome> {
    return this.http.post<RecipientActionOutcome>(
      `/orders/${orderId}/actions/updateRecipient`,
      request,
    );
  }

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
