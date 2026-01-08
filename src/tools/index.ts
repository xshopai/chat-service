/**
 * Tools Index
 * Exports all available tools and their definitions
 */
import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { productTools, searchProductsTool, getProductDetailsTool, getCategoriesTool } from './product.tools.js';
import { orderTools, getMyOrdersTool, getOrderDetailsTool, trackOrderTool } from './order.tools.js';

// Re-export individual tools
export { searchProductsTool, getProductDetailsTool, getCategoriesTool } from './product.tools.js';
export { getMyOrdersTool, getOrderDetailsTool, trackOrderTool } from './order.tools.js';

/**
 * All available tools for the chat assistant
 */
export const allTools: ChatCompletionTool[] = [...productTools, ...orderTools];

/**
 * Tool name constants
 */
export const ToolNames = {
  // Product tools
  SEARCH_PRODUCTS: 'searchProducts',
  GET_PRODUCT_DETAILS: 'getProductDetails',
  GET_CATEGORIES: 'getCategories',
  // Order tools
  GET_MY_ORDERS: 'getMyOrders',
  GET_ORDER_DETAILS: 'getOrderDetails',
  TRACK_ORDER: 'trackOrder',
} as const;

export type ToolName = (typeof ToolNames)[keyof typeof ToolNames];
