/**
 * Product Service Client
 * Handles communication with product-service via Dapr
 */
import { HttpMethod } from '@dapr/dapr';
import { daprClient } from '../core/daprClient.js';
import config from '../core/config.js';
import logger from '../core/logger.js';

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
 * Product service client for Dapr invocation
 */
class ProductClient {
  private appId = config.services.productService;

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

      const endpoint = `api/products/search?${queryParams.toString()}`;

      const result = await daprClient.invokeService<ProductSearchResult>(
        this.appId,
        endpoint,
        HttpMethod.GET,
        undefined,
        { headers: { 'x-trace-id': traceId || '' } }
      );

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

      const result = await daprClient.invokeService<Product>(
        this.appId,
        `api/products/${productId}`,
        HttpMethod.GET,
        undefined,
        { headers: { 'x-trace-id': traceId || '' } }
      );

      return result;
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

      const result = await daprClient.invokeService<{ categories: string[] }>(
        this.appId,
        'api/products/categories',
        HttpMethod.GET,
        undefined,
        { headers: { 'x-trace-id': traceId || '' } }
      );

      return result.categories || [];
    } catch (error: any) {
      log.error('Failed to get categories', { error: error.message });
      throw error;
    }
  }
}

export const productClient = new ProductClient();
export default productClient;
