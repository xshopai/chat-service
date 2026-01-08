/**
 * Home Routes for Chat Service
 * Route definitions for service information and version endpoints
 */

import { Router, RequestHandler } from 'express';
import * as homeController from '../controllers/home.controller.js';

const router = Router();

// Service Information Routes
router.get('/', homeController.info as unknown as RequestHandler);
router.get('/version', homeController.version as unknown as RequestHandler);

export default router;
