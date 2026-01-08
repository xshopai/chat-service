/**
 * Dapr Client Service
 * Handles service-to-service invocation via Dapr
 */
import { HttpMethod } from '@dapr/dapr';
import config from './config.js';

interface InvokeMetadata {
  headers?: Record<string, string>;
}

class DaprClientService {
  /**
   * Invoke a method on another Dapr service
   */
  async invokeService<T = any>(
    appId: string,
    methodName: string,
    httpMethod: HttpMethod,
    data?: any,
    metadata?: InvokeMetadata
  ): Promise<T> {
    try {
      const cleanMethodName = methodName.startsWith('/') ? methodName.slice(1) : methodName;
      const daprUrl = `http://${config.dapr.host}:${config.dapr.httpPort}/v1.0/invoke/${appId}/method/${cleanMethodName}`;

      const fetchHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...metadata?.headers,
      };

      const response = await fetch(daprUrl, {
        method: httpMethod.toUpperCase(),
        headers: fetchHeaders,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Dapr] HTTP ${response.status} from ${appId}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return (await response.json()) as T;
    } catch (error: any) {
      console.error(`[Dapr] Service invocation failed: ${appId}/${methodName}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

export const daprClient = new DaprClientService();
export default daprClient;
