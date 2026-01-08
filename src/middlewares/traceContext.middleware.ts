/**
 * Trace Context Middleware
 * Extracts or generates trace/span IDs for distributed tracing
 */
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      traceId: string;
      spanId: string;
    }
  }
}

/**
 * Middleware to extract or generate trace context
 */
export function traceContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Extract trace ID from various headers (Dapr, W3C Trace Context, custom)
  const traceId =
    req.headers['x-trace-id'] ||
    req.headers['x-correlation-id'] ||
    req.headers['traceparent']?.toString().split('-')[1] ||
    uuidv4();

  // Extract or generate span ID
  const spanId = req.headers['x-span-id'] || uuidv4().substring(0, 16);

  // Attach to request object
  req.traceId = typeof traceId === 'string' ? traceId : traceId[0];
  req.spanId = typeof spanId === 'string' ? spanId : spanId[0];

  // Set response headers for downstream tracing
  res.setHeader('x-trace-id', req.traceId);
  res.setHeader('x-span-id', req.spanId);

  next();
}
