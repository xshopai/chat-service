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
  async getOrders(params: GetOrdersParams, authToken?: string, traceId?: string): Promise<OrdersResult> {
    const log = traceId ? logger.withTraceContext(traceId) : logger;

    try {
      log.debug('Getting user orders', { userId: params.userId, status: params.status });

      // Use the correct order-service endpoint: /api/orders/customer/{customerId}
      const endpoint = `api/orders/customer/${params.userId}`;

      const headers: Record<string, string> = {
        'x-trace-id': traceId || '',
      };

      // Add authorization header if token is provided
      if (authToken) {
        headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
      }

      const orders = await daprClient.invokeService<Order[]>(this.appId, endpoint, HttpMethod.GET, undefined, {
        headers,
      });

      log.debug('Orders retrieved', { count: orders?.length ?? 0 });

      // Transform the response to match expected OrdersResult format
      return {
        orders: orders || [],
        total: orders?.length ?? 0,
        page: 1,
        pageSize: params.limit || 10,
      };
    } catch (error: any) {
      log.error('Failed to get orders', { error: error.message, userId: params.userId });
      throw error;
    }
  }

  /**
   * Get order details by ID
   */
  async getOrderById(orderId: string, userId: string, authToken?: string, traceId?: string): Promise<Order | null> {
    const log = traceId ? logger.withTraceContext(traceId) : logger;

    try {
      log.debug('Getting order details', { orderId, userId });

      const headers: Record<string, string> = {
        'x-trace-id': traceId || '',
        'x-user-id': userId,
      };

      // Add authorization header if token is provided
      if (authToken) {
        headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
      }

      const result = await daprClient.invokeService<Order>(
        this.appId,
        `api/orders/${orderId}`,
        HttpMethod.GET,
        undefined,
        { headers }
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
  async trackOrder(orderId: string, userId: string, authToken?: string, traceId?: string): Promise<OrderTrackingInfo | null> {
    const log = traceId ? logger.withTraceContext(traceId) : logger;

    try {
      log.debug('Getting order tracking', { orderId, userId });

      const headers: Record<string, string> = {
        'x-trace-id': traceId || '',
        'x-user-id': userId,
      };

      // Add authorization header if token is provided
      if (authToken) {
        headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
      }

      const result = await daprClient.invokeService<OrderTrackingInfo>(
        this.appId,
        `api/orders/${orderId}/tracking`,
        HttpMethod.GET,
        undefined,
        { headers }
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
