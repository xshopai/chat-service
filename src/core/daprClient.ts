/**
 * Service Client
 * Handles service-to-service invocation
 * - When MESSAGING_PROVIDER=dapr: Uses Dapr service invocation
 * - Otherwise: Uses direct HTTP calls
 */
import config from './config.js';

interface InvokeMetadata {
  headers?: Record<string, string>;
}

// Determine service invocation mode based on MESSAGING_PROVIDER
const MESSAGING_PROVIDER = process.env.MESSAGING_PROVIDER || 'rabbitmq';
const USE_DAPR = MESSAGING_PROVIDER === 'dapr';

// Dapr sidecar configuration (only used when MESSAGING_PROVIDER=dapr)
const DAPR_HOST = process.env.DAPR_HOST || 'localhost';
const DAPR_HTTP_PORT = process.env.DAPR_HTTP_PORT || '3500';

// Dapr App IDs for service discovery (used when MESSAGING_PROVIDER=dapr)
const DAPR_APP_IDS: Record<string, string> = {
  'product-service': process.env.DAPR_PRODUCT_SERVICE_APP_ID || 'product-service',
  'order-service': process.env.DAPR_ORDER_SERVICE_APP_ID || 'order-service',
  'user-service': process.env.DAPR_USER_SERVICE_APP_ID || 'user-service',
  'inventory-service': process.env.DAPR_INVENTORY_SERVICE_APP_ID || 'inventory-service',
};

// Direct HTTP URLs for service discovery (used when MESSAGING_PROVIDER != dapr)
const SERVICE_URLS: Record<string, string> = {
  'product-service': process.env.PRODUCT_SERVICE_URL || 'http://xshopai-product-service:8001',
  'order-service': process.env.ORDER_SERVICE_URL || 'http://xshopai-order-service:8006',
  'user-service': process.env.USER_SERVICE_URL || 'http://xshopai-user-service:8002',
  'inventory-service': process.env.INVENTORY_SERVICE_URL || 'http://xshopai-inventory-service:8005',
};

class ServiceClient {
  /**
   * Invoke a method on another service
   * - When MESSAGING_PROVIDER=dapr: Uses Dapr service invocation
   * - Otherwise: Uses direct HTTP calls
   */
  async invokeService<T = any>(
    serviceName: string,
    methodName: string,
    httpMethod: string,
    data?: any,
    metadata?: InvokeMetadata,
  ): Promise<T> {
    try {
      let url: string;
      const cleanMethodName = methodName.startsWith('/') ? methodName.slice(1) : methodName;

      if (USE_DAPR) {
        // Dapr service invocation: http://localhost:3500/v1.0/invoke/{appId}/method/{method}
        const appId = DAPR_APP_IDS[serviceName] || serviceName;
        url = `http://${DAPR_HOST}:${DAPR_HTTP_PORT}/v1.0/invoke/${appId}/method/${cleanMethodName}`;
        console.log(`[ServiceClient] Calling ${httpMethod} ${url} (via Dapr)`);
      } else {
        // Direct HTTP call
        const baseUrl = SERVICE_URLS[serviceName] || `http://xshopai-${serviceName}:8000`;
        url = `${baseUrl}/${cleanMethodName}`;
        console.log(`[ServiceClient] Calling ${httpMethod} ${url} (direct HTTP)`);
      }

      const fetchHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...metadata?.headers,
      };

      const response = await fetch(url, {
        method: httpMethod.toUpperCase(),
        headers: fetchHeaders,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ServiceClient] HTTP ${response.status} from ${serviceName}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return (await response.json()) as T;
    } catch (error: any) {
      console.error(`[ServiceClient] Service invocation failed: ${serviceName}/${methodName}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

export const serviceClient = new ServiceClient();
// Export as daprClient for backward compatibility
export const daprClient = serviceClient;
export default serviceClient;
