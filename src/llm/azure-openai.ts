/**
 * Azure OpenAI Client
 * Handles LLM interactions with function calling support
 * Supports both API key and Managed Identity authentication
 */
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';
import { AzureOpenAI } from 'openai';
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from 'openai/resources/chat/completions';
import config from '../core/config.js';
import logger from '../core/logger.js';

// LLM Client singleton
let client: AzureOpenAI | null = null;

/**
 * Get or create the Azure OpenAI client
 * Uses Managed Identity if configured, otherwise falls back to API key
 */
function getClient(): AzureOpenAI {
  if (!client) {
    if (!config.azureOpenAI.endpoint) {
      throw new Error('Azure OpenAI endpoint is not configured. Set AZURE_OPENAI_ENDPOINT');
    }

    if (config.azureOpenAI.useManagedIdentity) {
      // Use Managed Identity authentication (recommended for production)
      logger.info('Initializing Azure OpenAI client with Managed Identity authentication');
      const credential = new DefaultAzureCredential();
      const azureADTokenProvider = getBearerTokenProvider(
        credential,
        'https://cognitiveservices.azure.com/.default'
      );

      client = new AzureOpenAI({
        endpoint: config.azureOpenAI.endpoint,
        azureADTokenProvider,
        apiVersion: config.azureOpenAI.apiVersion,
      });
    } else {
      // Use API key authentication (for local development)
      if (!config.azureOpenAI.apiKey) {
        throw new Error(
          'Azure OpenAI API key is not configured. Set AZURE_OPENAI_API_KEY or enable Managed Identity with AZURE_USE_MANAGED_IDENTITY=true'
        );
      }
      logger.info('Initializing Azure OpenAI client with API key authentication');
      client = new AzureOpenAI({
        endpoint: config.azureOpenAI.endpoint,
        apiKey: config.azureOpenAI.apiKey,
        apiVersion: config.azureOpenAI.apiVersion,
      });
    }
  }
  return client;
}

/**
 * Chat completion request options
 */
export interface ChatCompletionOptions {
  messages: ChatCompletionMessageParam[];
  tools?: ChatCompletionTool[];
  toolChoice?: ChatCompletionToolChoiceOption;
  temperature?: number;
  maxTokens?: number;
  traceId?: string;
}

/**
 * Chat completion response
 */
export interface ChatCompletionResult {
  content: string | null;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Send a chat completion request to Azure OpenAI
 */
export async function sendChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const log = options.traceId ? logger.withTraceContext(options.traceId) : logger;

  try {
    const openaiClient = getClient();

    log.debug('Sending chat completion request', {
      messageCount: options.messages.length,
      hasTools: !!options.tools?.length,
      deployment: config.azureOpenAI.deploymentName,
    });

    const response = await openaiClient.chat.completions.create({
      model: config.azureOpenAI.deploymentName,
      messages: options.messages,
      tools: options.tools,
      tool_choice: options.toolChoice,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    });

    const choice = response.choices[0];

    log.debug('Chat completion response received', {
      finishReason: choice.finish_reason,
      hasToolCalls: !!choice.message.tool_calls?.length,
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
    });

    return {
      content: choice.message.content,
      toolCalls: choice.message.tool_calls?.map((tc: any) => ({
        id: tc.id,
        name: tc.function?.name || '',
        arguments: tc.function?.arguments || '',
      })),
      finishReason: choice.finish_reason,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  } catch (error: any) {
    log.error('Azure OpenAI request failed', {
      error: error.message,
      code: error.code,
      status: error.status,
    });
    throw error;
  }
}

/**
 * Check if Azure OpenAI is configured
 */
export function isConfigured(): boolean {
  return !!(
    config.azureOpenAI.endpoint &&
    (config.azureOpenAI.useManagedIdentity || config.azureOpenAI.apiKey)
  );
}
