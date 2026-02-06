/**
 * Operational Routes
 * Health checks and readiness probes
 */
import { Router, Request, Response } from 'express';
import config from '../core/config.js';

const router = Router();

/**
 * Readiness probe - checks if service is ready to accept traffic
 */
const readinessHandler = (_req: Request, res: Response) => {
  const hasLlmConfig = !!(config.azureOpenAI.endpoint && config.azureOpenAI.apiKey);

  res.json({
    status: hasLlmConfig ? 'ready' : 'degraded',
    service: config.service.name,
    checks: {
      llmConfigured: hasLlmConfig,
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Liveness probe - checks if service is alive
 */
const livenessHandler = (_req: Request, res: Response) => {
  res.json({
    status: 'alive',
    service: config.service.name,
    timestamp: new Date().toISOString(),
  });
};

// Standard Kubernetes/Docker health check paths
router.get('/health/ready', readinessHandler);
router.get('/health/live', livenessHandler); // Used by Docker HEALTHCHECK

export default router;
