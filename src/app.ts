/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './core/config.js';
import logger from './core/logger.js';
import { traceContextMiddleware } from './middlewares/traceContext.middleware.js';
import homeRoutes from './routes/home.routes.js';
import chatRoutes from './routes/chat.routes.js';
import operationalRoutes from './routes/operational.routes.js';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.cors.origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-trace-id', 'x-span-id', 'x-correlation-id'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trace context middleware
app.use(traceContextMiddleware);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const traceId = req.traceId || 'no-trace';

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.path} ${res.statusCode}`, {
      traceId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });

  next();
});

// Routes
app.use('/', homeRoutes);
app.use('/', operationalRoutes);
app.use('/api/chat', chatRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const traceId = req.traceId || 'no-trace';

  logger.error('Unhandled error', {
    traceId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: config.service.nodeEnv === 'development' ? err.message : 'An unexpected error occurred',
  });
});

export default app;
