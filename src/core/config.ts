/**
 * Configuration module for chat-service
 * Centralizes all environment-based configuration
 */
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  service: {
    name: string;
    version: string;
    port: number;
    host: string;
    nodeEnv: string;
  };
  cors: {
    origins: string[];
  };
  logging: {
    level: string;
    format: string;
    toConsole: boolean;
    toFile: boolean;
    filePath: string;
  };
  dapr: {
    httpPort: number;
    grpcPort: number;
    appPort: number;
    host: string;
    appId: string;
  };
  azureOpenAI: {
    endpoint: string;
    apiKey: string;
    deploymentName: string;
    apiVersion: string;
  };
  services: {
    productService: string;
    orderService: string;
  };
}

const config: Config = {
  service: {
    name: process.env.NAME || 'chat-service',
    version: process.env.VERSION || '1.0.0',
    port: parseInt(process.env.PORT || '8014', 10),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3010'],
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'console',
    toConsole: process.env.LOG_TO_CONSOLE !== 'false',
    toFile: process.env.LOG_TO_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH || './logs/chat-service.log',
  },

  dapr: {
    httpPort: parseInt(process.env.DAPR_HTTP_PORT || '3514', 10),
    grpcPort: parseInt(process.env.DAPR_GRPC_PORT || '50014', 10),
    appPort: parseInt(process.env.PORT || '8014', 10),
    host: process.env.DAPR_HOST || 'localhost',
    appId: process.env.DAPR_APP_ID || 'chat-service',
  },

  azureOpenAI: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
  },

  services: {
    productService: process.env.PRODUCT_SERVICE_APP_ID || 'product-service',
    orderService: process.env.ORDER_SERVICE_APP_ID || 'order-service',
  },
};

export default config;
