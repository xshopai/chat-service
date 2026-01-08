/**
 * Chat Service
 * Orchestrates LLM interactions with function calling
 */
import { ChatCompletionMessageParam, ChatCompletionToolMessageParam } from 'openai/resources/chat/completions';
import { sendChatCompletion, isConfigured, ChatCompletionResult } from '../llm/azure-openai.js';
import { allTools, ToolNames } from '../tools/index.js';
import { productClient } from '../clients/product.client.js';
import { orderClient } from '../clients/order.client.js';
import logger from '../core/logger.js';

const SYSTEM_PROMPT = `You are a helpful shopping assistant for an e-commerce platform. You can help customers with:

1. **Product Search**: Find products by name, category, price range, or description
2. **Product Information**: Get details about specific products
3. **Order History**: View past orders and their status
4. **Order Tracking**: Track shipments and delivery status

Be friendly, concise, and helpful. 

IMPORTANT: When showing products or orders, do NOT list them in your text response. The UI will automatically display interactive product/order cards with images, prices, and ratings. Just provide a brief summary like "Here are some phones I found for you:" or "I found 5 products matching your search." Let the cards do the work of showing details.

If the user is not logged in (no userId provided), you can still help with product searches but will need to let them know they need to log in to view their orders.

Always use the available tools to get real data - don't make up product names, prices, or order information.`;

export interface ChatRequest {
  message: string;
  userId?: string;
  conversationId?: string;
  context?: {
    previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  };
  traceId?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  data?: {
    products?: any[];
    orders?: any[];
  };
  metadata?: {
    toolsUsed?: string[];
    tokensUsed?: number;
  };
}

/**
 * Chat service class
 */
class ChatService {
  /**
   * Process a chat message and return a response
   */
  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    const { message, userId, conversationId, context, traceId } = request;
    const log = traceId ? logger.withTraceContext(traceId) : logger;
    const currentConversationId = conversationId || this.generateConversationId();

    // Check if LLM is configured
    if (!isConfigured()) {
      log.warn('LLM not configured, returning fallback response');
      return {
        message:
          "I'm sorry, the chat service is not fully configured yet. Please try again later or contact support.",
        conversationId: currentConversationId,
      };
    }

    try {
      // Build message history
      const messages: ChatCompletionMessageParam[] = [{ role: 'system', content: SYSTEM_PROMPT }];

      // Add previous messages from context
      if (context?.previousMessages) {
        for (const prevMsg of context.previousMessages.slice(-10)) {
          messages.push({
            role: prevMsg.role,
            content: prevMsg.content,
          });
        }
      }

      // Add current user message
      messages.push({ role: 'user', content: message });

      // Send to LLM with tools
      let result = await sendChatCompletion({
        messages,
        tools: allTools,
        toolChoice: 'auto',
        traceId,
      });

      const toolsUsed: string[] = [];
      const collectedData: { products?: any[]; orders?: any[] } = {};
      let iterations = 0;
      const maxIterations = 5;

      // Handle tool calls in a loop
      while (result.toolCalls && result.toolCalls.length > 0 && iterations < maxIterations) {
        iterations++;
        log.debug(`Processing tool calls (iteration ${iterations})`, {
          toolCount: result.toolCalls.length,
        });

        // Add assistant message with tool calls
        messages.push({
          role: 'assistant',
          content: result.content,
          tool_calls: result.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        });

        // Execute each tool call
        for (const toolCall of result.toolCalls) {
          const toolResult = await this.executeToolCall(toolCall.name, toolCall.arguments, userId, traceId);
          toolsUsed.push(toolCall.name);

          // Collect structured data for UI rendering
          this.collectToolData(toolCall.name, toolResult, collectedData);

          const toolMessage: ChatCompletionToolMessageParam = {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          };
          messages.push(toolMessage);
        }

        // Get next response from LLM
        result = await sendChatCompletion({
          messages,
          tools: allTools,
          toolChoice: 'auto',
          traceId,
        });
      }

      return {
        message: result.content || "I'm sorry, I couldn't generate a response. Please try again.",
        conversationId: currentConversationId,
        data: Object.keys(collectedData).length > 0 ? collectedData : undefined,
        metadata: {
          toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
          tokensUsed: result.usage?.totalTokens,
        },
      };
    } catch (error: any) {
      log.error('Chat processing failed', {
        error: error.message,
        stack: error.stack,
      });

      return {
        message: "I'm sorry, I encountered an error processing your request. Please try again.",
        conversationId: currentConversationId,
      };
    }
  }

  /**
   * Execute a tool call and return the result
   */
  private async executeToolCall(
    toolName: string,
    argsJson: string,
    userId?: string,
    traceId?: string
  ): Promise<any> {
    const log = traceId ? logger.withTraceContext(traceId) : logger;

    try {
      const args = JSON.parse(argsJson);
      log.debug('Executing tool', { toolName, args });

      switch (toolName) {
        case ToolNames.SEARCH_PRODUCTS: {
          log.info('searchProducts called with args', { args });
          const result = await productClient.searchProducts(
            {
              query: args.query,
              category: args.category,
              minPrice: args.minPrice,
              maxPrice: args.maxPrice,
              limit: args.limit || 10,
            },
            traceId
          );
          log.info('searchProducts result', { productCount: result.products?.length ?? 0 });
          return result;
        }

        case ToolNames.GET_PRODUCT_DETAILS: {
          const product = await productClient.getProductById(args.productId, traceId);
          if (!product) {
            return { error: 'Product not found' };
          }
          return product;
        }

        case ToolNames.GET_CATEGORIES: {
          const categories = await productClient.getCategories(traceId);
          return { categories };
        }

        case ToolNames.GET_MY_ORDERS: {
          if (!userId) {
            return { error: 'User not logged in. Please log in to view your orders.' };
          }
          const result = await orderClient.getOrders(
            {
              userId,
              status: args.status,
              limit: args.limit || 10,
              offset: args.offset,
            },
            traceId
          );
          return result;
        }

        case ToolNames.GET_ORDER_DETAILS: {
          if (!userId) {
            return { error: 'User not logged in. Please log in to view order details.' };
          }
          const order = await orderClient.getOrderById(args.orderId, userId, traceId);
          if (!order) {
            return { error: 'Order not found' };
          }
          return order;
        }

        case ToolNames.TRACK_ORDER: {
          if (!userId) {
            return { error: 'User not logged in. Please log in to track orders.' };
          }
          const tracking = await orderClient.trackOrder(args.orderId, userId, traceId);
          if (!tracking) {
            return { error: 'Tracking information not available for this order' };
          }
          return tracking;
        }

        default:
          log.warn('Unknown tool called', { toolName });
          return { error: `Unknown tool: ${toolName}` };
      }
    } catch (error: any) {
      log.error('Tool execution failed', {
        toolName,
        error: error.message,
      });
      return { error: `Failed to execute ${toolName}: ${error.message}` };
    }
  }

  /**
   * Generate a unique conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Collect structured data from tool results for UI rendering
   */
  private collectToolData(
    toolName: string,
    toolResult: any,
    collectedData: { products?: any[]; orders?: any[] }
  ): void {
    if (toolResult.error) return;

    switch (toolName) {
      case ToolNames.SEARCH_PRODUCTS:
        if (toolResult.products && Array.isArray(toolResult.products)) {
          collectedData.products = (collectedData.products || []).concat(toolResult.products);
        }
        break;

      case ToolNames.GET_PRODUCT_DETAILS:
        if (toolResult && toolResult._id) {
          collectedData.products = collectedData.products || [];
          collectedData.products.push(toolResult);
        }
        break;

      case ToolNames.GET_MY_ORDERS:
        if (toolResult.orders && Array.isArray(toolResult.orders)) {
          collectedData.orders = (collectedData.orders || []).concat(toolResult.orders);
        }
        break;

      case ToolNames.GET_ORDER_DETAILS:
        if (toolResult && (toolResult.orderId || toolResult.id)) {
          collectedData.orders = collectedData.orders || [];
          collectedData.orders.push(toolResult);
        }
        break;
    }
  }
}

export const chatService = new ChatService();
export default chatService;
