/**
 * Clients Index
 * Exports all service clients
 */
export { productClient, Product, ProductSearchParams, ProductSearchResult } from './product.client.js';
export {
  orderClient,
  Order,
  OrderItem,
  OrderTrackingInfo,
  GetOrdersParams,
  OrdersResult,
} from './order.client.js';
