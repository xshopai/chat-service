/**
 * Home Controller
 * Handles service information and version endpoints
 */

import { Request, Response } from 'express';
import config from '../core/config.js';

/**
 * Service information endpoint
 */
export const info = (_req: Request, res: Response): void => {
  res.json({
    message: 'Welcome to the Chat Service',
    service: config.service.name,
    description: 'AI-powered chat service for xshopai platform',
    environment: config.service.nodeEnv,
  });
};

/**
 * Service version endpoint
 */
export const version = (_req: Request, res: Response): void => {
  res.json({
    service: config.service.name,
    version: config.service.version,
  });
};
