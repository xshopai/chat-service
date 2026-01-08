/**
 * Operational Routes
 * Health checks and readiness probes
 */
import { Router, Request, Response } from 'express';
import config from '../core/config.js';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: config.service.name,
    version: config.service.version,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe - checks if service is ready to accept traffic
 */
router.get('/ready', (_req: Request, res: Response) => {
  const hasLlmConfig = !!(config.azureOpenAI.endpoint && config.azureOpenAI.apiKey);

  res.json({
    status: hasLlmConfig ? 'ready' : 'degraded',
    service: config.service.name,
    checks: {
      llmConfigured: hasLlmConfig,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Liveness probe - checks if service is alive
 */
router.get('/live', (_req: Request, res: Response) => {
  res.json({
    status: 'alive',
    service: config.service.name,
    timestamp: new Date().toISOString(),
  });
});

export default router;
