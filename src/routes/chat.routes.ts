/**
 * Chat Routes
 * Endpoints for chat interactions
 */
import { Router, Request, Response } from 'express';
import { chatService } from '../services/chat.service.js';
import logger from '../core/logger.js';

const router = Router();

/**
 * POST /api/chat/message
 * Send a message and get an AI response
 */
router.post('/message', async (req: Request, res: Response) => {
  const traceId = req.traceId;
  const log = logger.withTraceContext(traceId);

  try {
    const { message, userId, conversationId, context, authToken } = req.body;

    // DEBUG: Log what we received
    console.log('💬 [chat-service] /message received:', {
      hasUserId: !!userId,
      userId,
      hasAuthToken: !!authToken,
      messagePreview: message?.substring(0, 50),
      bodyKeys: Object.keys(req.body),
    });

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Message is required and must be a string',
      });
    }

    log.info('Processing chat message', {
      userId,
      conversationId,
      messageLength: message.length,
    });

    const response = await chatService.processMessage({
      message,
      userId,
      conversationId,
      context,
      traceId,
      authToken, // Pass auth token for downstream service calls
    });

    return res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    log.error('Failed to process chat message', {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to process chat message',
    });
  }
});

/**
 * GET /api/chat/history/:conversationId
 * Get conversation history (stub - to be implemented with persistence)
 */
router.get('/history/:conversationId', async (req: Request, res: Response) => {
  const traceId = req.traceId;
  const log = logger.withTraceContext(traceId);

  try {
    const { conversationId } = req.params;

    log.info('Fetching conversation history', { conversationId });

    // TODO: Implement conversation persistence
    // For now, return empty history
    return res.json({
      success: true,
      data: {
        conversationId,
        messages: [],
      },
    });
  } catch (error: any) {
    log.error('Failed to fetch conversation history', {
      error: error.message,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch conversation history',
    });
  }
});

export default router;
