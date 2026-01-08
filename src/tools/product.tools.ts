/**
 * Product Tools
 * Function definitions for product-related operations
 */
import { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * Search products tool definition
 */
export const searchProductsTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'searchProducts',
    description:
      'Search for products in the catalog by keyword, category, or filters. Use this when the user asks about products, wants to find items, browse categories, or check product availability.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query or keywords to find products (e.g., "running shoes", "laptop", "red dress")',
        },
        category: {
          type: 'string',
          description: 'Filter by product category (e.g., "Electronics", "Clothing", "Sports")',
        },
        minPrice: {
          type: 'number',
          description: 'Minimum price filter',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price filter',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)',
        },
      },
      required: [],
    },
  },
};

/**
 * Get product details tool definition
 */
export const getProductDetailsTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'getProductDetails',
    description:
      'Get detailed information about a specific product by its ID. Use this when the user asks for details about a particular product, wants to know specifications, availability, or pricing.',
    parameters: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'The unique identifier of the product',
        },
      },
      required: ['productId'],
    },
  },
};

/**
 * Get product categories tool definition
 */
export const getCategoriesTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'getCategories',
    description:
      'Get a list of all available product categories. Use this when the user wants to browse categories or asks what types of products are available.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
};

/**
 * All product-related tools
 */
export const productTools: ChatCompletionTool[] = [searchProductsTool, getProductDetailsTool, getCategoriesTool];
