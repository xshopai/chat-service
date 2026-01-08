/**
 * Order Service Client
 * Handles communication with order-service via Dapr
 */
import { HttpMethod } from '@dapr/dapr';
import { daprClient } from '../core/daprClient.js';
import config from '../core/config.js';
import logger from '../core/logger.js';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  currency: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderTrackingInfo {
  orderId: string;
  status: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  carrier?: string;
  events: Array<{
    status: string;
    timestamp: string;
    location?: string;
    description: string;
  }>;
}

export interface GetOrdersParams {
  userId: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface OrdersResult {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Order service client for Dapr invocation
 */
class OrderClient {
  private appId = config.services.orderService;

  /**
   * Get orders for a user
   */
  async getOrders(params: GetOrdersParams, traceId?: string): Promise<OrdersResult> {
    const log = traceId ? logger.withTraceContext(traceId) : logger;

    try {
      log.debug('Getting user orders', { userId: params.userId, status: params.status });

      const queryParams = new URLSearchParams();
      queryParams.set('userId', params.userId);
      if (params.status) queryParams.set('status', params.status);
      if (params.limit) queryParams.set('limit', String(params.limit));
      if (params.offset) queryParams.set('offset', String(params.offset));

      const endpoint = `api/orders?${queryParams.toString()}`;

      const result = await daprClient.invokeService<OrdersResult>(this.appId, endpoint, HttpMethod.GET, undefined, {
        headers: { 'x-trace-id': traceId || '' },
      });

      log.debug('Orders retrieved', { count: result.orders?.length ?? 0 });

      return result;
    } catch (error: any) {
      log.error('Failed to get orders', { error: error.message, userId: params.userId });
      throw error;
    }
  }

  /**
   * Get order details by ID
   */
  async getOrderById(orderId: string, userId: string, traceId?: string): Promise<Order | null> {
    const log = traceId ? logger.withTraceContext(traceId) : logger;

    try {
      log.debug('Getting order details', { orderId, userId });

      const result = await daprClient.invokeService<Order>(
        this.appId,
        `api/orders/${orderId}`,
        HttpMethod.GET,
        undefined,
        { headers: { 'x-trace-id': traceId || '', 'x-user-id': userId } }
      );

      return result;
    } catch (error: any) {
      if (error.message.includes('404')) {
        log.debug('Order not found', { orderId });
        return null;
      }
      log.error('Failed to get order', { error: error.message, orderId });
      throw error;
    }
  }

  /**
   * Get tracking information for an order
   */
  async trackOrder(orderId: string, userId: string, traceId?: string): Promise<OrderTrackingInfo | null> {
    const log = traceId ? logger.withTraceContext(traceId) : logger;

    try {
      log.debug('Getting order tracking', { orderId, userId });

      const result = await daprClient.invokeService<OrderTrackingInfo>(
        this.appId,
        `api/orders/${orderId}/tracking`,
        HttpMethod.GET,
        undefined,
        { headers: { 'x-trace-id': traceId || '', 'x-user-id': userId } }
      );

      return result;
    } catch (error: any) {
      if (error.message.includes('404')) {
        log.debug('Order tracking not found', { orderId });
        return null;
      }
      log.error('Failed to get order tracking', { error: error.message, orderId });
      throw error;
    }
  }
}

export const orderClient = new OrderClient();
export default orderClient;
