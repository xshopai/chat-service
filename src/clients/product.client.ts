/**
 * Product Service Client
 * Handles communication with product-service via HTTP or Dapr
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

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl?: string;
  inStock: boolean;
  quantity?: number;
}

export interface ProductSearchParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Product service client with dual-mode support (HTTP/Dapr)
 */
class ProductClient {
  private mode = config.serviceInvocation.mode;
  private appId = config.services.productService.appId;
  private baseUrl = config.services.productService.url;

  /**
   * Search products with optional filters
   */
  async searchProducts(params: ProductSearchParams, traceId?: string): Promise<ProductSearchResult> {
    const log = traceId ? logger.withTraceContext(traceId) : logger;

    try {
      log.debug('Searching products', { params });

      // Build query string - q is required by product-service
      const queryParams = new URLSearchParams();

      // Always set q - use query if provided, otherwise use category, otherwise use '*' for all
      const searchQuery = params.query || params.category || '*';
      queryParams.set('q', searchQuery);

      // Only add category filter if there's no text query (category alone search)
      // When there's a text query, the search is sufficient and category filter can cause mismatches
      // (e.g., "phones" are in department "Electronics" but category "Mobile")
      if (!params.query && params.category) {
        queryParams.set('category', params.category);
      }

      if (params.minPrice !== undefined) queryParams.set('minPrice', String(params.minPrice));
      if (params.maxPrice !== undefined) queryParams.set('maxPrice', String(params.maxPrice));
      if (params.limit) queryParams.set('limit', String(params.limit));

      let result: ProductSearchResult;

      if (this.mode === 'dapr' && daprClient) {
        const endpoint = `api/products/search?${queryParams.toString()}`;
        result = await daprClient.invoker.invoke(
          this.appId,
          endpoint,
          HttpMethod.GET
        ) as ProductSearchResult;
      } else {
        const url = `${this.baseUrl}/api/products/search?${queryParams.toString()}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-trace-id': traceId || '',
          },
        });

        if (!response.ok) {
          throw new Error(`Product search failed: ${response.status} ${response.statusText}`);
        }

        result = (await response.json()) as ProductSearchResult;
      }

      log.debug('Product search completed', {
        resultCount: result.products?.length ?? 0,
      });

      return result;
    } catch (error: any) {
      log.error('Failed to search products', { error: error.message, params });
      throw error;
    }
  }

  /**
   * Get product details by ID
   */
  async getProductById(productId: string, traceId?: string): Promise<Product | null> {
    const log = traceId ? logger.withTraceContext(traceId) : logger;

    try {
      log.debug('Getting product details', { productId });

      if (this.mode === 'dapr' && daprClient) {
        const result = await daprClient.invoker.invoke(
          this.appId,
          `api/products/${productId}`,
          HttpMethod.GET
        ) as Product;
        return result;
      } else {
        const url = `${this.baseUrl}/api/products/${productId}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-trace-id': traceId || '',
          },
        });

        if (response.status === 404) {
          log.debug('Product not found', { productId });
          return null;
        }

        if (!response.ok) {
          throw new Error(`Get product failed: ${response.status} ${response.statusText}`);
        }

        const result = (await response.json()) as Product;
        return result;
      }
    } catch (error: any) {
      if (error.message.includes('404')) {
        log.debug('Product not found', { productId });
        return null;
      }
      log.error('Failed to get product', { error: error.message, productId });
      throw error;
    }
  }

  /**
   * Get all product categories
   */
  async getCategories(traceId?: string): Promise<string[]> {
    const log = traceId ? logger.withTraceContext(traceId) : logger;

    try {
      log.debug('Getting product categories');

      let result: { categories: string[] };

      if (this.mode === 'dapr' && daprClient) {
        result = await daprClient.invoker.invoke(
          this.appId,
          'api/products/categories',
          HttpMethod.GET
        ) as { categories: string[] };
      } else {
        const url = `${this.baseUrl}/api/products/categories`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-trace-id': traceId || '',
          },
        });

        if (!response.ok) {
          throw new Error(`Get categories failed: ${response.status} ${response.statusText}`);
        }

        result = (await response.json()) as { categories: string[] };
      }

      return result.categories || [];
    } catch (error: any) {
      log.error('Failed to get categories', { error: error.message });
      throw error;
    }
  }
}

export const productClient = new ProductClient();
export default productClient;
