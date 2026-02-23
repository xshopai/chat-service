/**
 * Order Service Client
 * Handles communication with order-service via HTTP or Dapr
 */
import { HttpMethod, DaprClient } from '@dapr/dapr';
import config from '../core/config.js';
import logger from '../core/logger.js';

// Initialize Dapr client only if in Dapr mode
let daprClient: DaprClient | null = null;
if (config.serviceInvocation.mode === 'dapr') {
  daprClient = new DaprClient({
    daprHost: config.serviceInvocation.dapr?.host,
    daprPort: config.serviceInvocation.dapr?.httpPort?.toString(),
  });
}

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
 * Order service client with dual-mode support (HTTP/Dapr)
 */
class OrderClient {
  private mode = config.serviceInvocation.mode;
  private appId = config.services.orderService.appId;
  private baseUrl = config.services.orderService.url;

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

      let orders: Order[];

      if (this.mode === 'dapr' && daprClient) {
        orders = (await daprClient.invoker.invoke(this.appId, endpoint, HttpMethod.GET)) as Order[];
      } else {
        const url = `${this.baseUrl}/${endpoint}`;
        headers['Content-Type'] = 'application/json';
        const response = await fetch(url, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          throw new Error(`Get orders failed: ${response.status} ${response.statusText}`);
        }

        orders = (await response.json()) as Order[];
      }

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

      if (this.mode === 'dapr' && daprClient) {
        const result = (await daprClient.invoker.invoke(this.appId, `api/orders/${orderId}`, HttpMethod.GET)) as Order;
        return result;
      } else {
        const url = `${this.baseUrl}/api/orders/${orderId}`;
        const response = await fetch(url, {
          method: 'GET',
          headers,
        });

        if (response.status === 404) {
          log.debug('Order not found', { orderId });
          return null;
        }

        if (!response.ok) {
          throw new Error(`Get order failed: ${response.status} ${response.statusText}`);
        }

        const result = (await response.json()) as Order;
        return result;
      }
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
  async trackOrder(
    orderId: string,
    userId: string,
    authToken?: string,
    traceId?: string,
  ): Promise<OrderTrackingInfo | null> {
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

      if (this.mode === 'dapr' && daprClient) {
        const result = (await daprClient.invoker.invoke(
          this.appId,
          `api/orders/${orderId}/tracking`,
          HttpMethod.GET,
        )) as OrderTrackingInfo;
        return result;
      } else {
        const url = `${this.baseUrl}/api/orders/${orderId}/tracking`;
        const response = await fetch(url, {
          method: 'GET',
          headers,
        });

        if (response.status === 404) {
          log.debug('Order tracking not found', { orderId });
          return null;
        }

        if (!response.ok) {
          throw new Error(`Get order tracking failed: ${response.status} ${response.statusText}`);
        }

        const result = (await response.json()) as OrderTrackingInfo;
        return result;
      }
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
