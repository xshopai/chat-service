/**
 * Server Entry Point
 * Starts the HTTP server and initializes services
 */
import dotenv from 'dotenv';
dotenv.config();

// Initialize Zipkin tracing FIRST
import './tracing.js';

import app from './app.js';
import config from './core/config.js';
import logger from './core/logger.js';

const PORT = config.service.port;
const HOST = config.service.host;

/**
 * Validate required configuration
 */
function validateConfig(): void {
  const missing: string[] = [];

  if (!config.azureOpenAI.endpoint) {
    missing.push('AZURE_OPENAI_ENDPOINT');
  }
  if (!config.azureOpenAI.apiKey) {
    missing.push('AZURE_OPENAI_API_KEY');
  }

  if (missing.length > 0) {
    logger.warn(`Missing required configuration: ${missing.join(', ')}`, {
      missing,
    });
    logger.warn('Chat service will start but LLM features will not work until configured');
  }
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown(server: any): void {
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    validateConfig();

    const server = app.listen(PORT, HOST, () => {
      logger.info(`${config.service.name} started`, {
        host: HOST,
        port: PORT,
        environment: config.service.nodeEnv,
        version: config.service.version,
        daprHttpPort: config.dapr.httpPort,
        daprAppId: config.dapr.appId,
      });

      if (config.service.nodeEnv === 'development') {
        logger.debug('Debug logging enabled');
        logger.debug(`API base URL: http://${HOST}:${PORT}`);
        logger.debug(`Health check: http://${HOST}:${PORT}/health`);
      }
    });

    setupGracefulShutdown(server);
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();
