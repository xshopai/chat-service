/**
 * Order Tools
 * Function definitions for order-related operations
 */
import { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * Get user orders tool definition
 */
export const getMyOrdersTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'getMyOrders',
    description:
      'Get the order history for the current user. Use this when the user asks about their orders, wants to check order status, or view past purchases.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
          description: 'Filter orders by status',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of orders to return (default: 10)',
        },
        offset: {
          type: 'number',
          description: 'Number of orders to skip for pagination',
        },
      },
      required: [],
    },
  },
};

/**
 * Get order details tool definition
 */
export const getOrderDetailsTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'getOrderDetails',
    description:
      'Get detailed information about a specific order. Use this when the user asks about a particular order, wants tracking information, or order specifics.',
    parameters: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'The unique identifier of the order',
        },
      },
      required: ['orderId'],
    },
  },
};

/**
 * Track order tool definition
 */
export const trackOrderTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'trackOrder',
    description:
      'Get tracking information for an order. Use this when the user wants to know where their order is or check delivery status.',
    parameters: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'The unique identifier of the order to track',
        },
      },
      required: ['orderId'],
    },
  },
};

/**
 * All order-related tools
 */
export const orderTools: ChatCompletionTool[] = [getMyOrdersTool, getOrderDetailsTool, trackOrderTool];
