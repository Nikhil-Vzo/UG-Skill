import { Request, Response } from 'express';
import { logger } from '../../lib/logger';
import { aiService } from './ai.service';

export const handleAiChat = async (req: Request, res: Response) => {
  try {
    const { message, context, sessionId: existingSessionId } = req.body;
    const userId = req.user?.userId || 'anonymous';
    const sessionId = existingSessionId || `session_${Date.now()}`;

    // 1. Log user message
    await aiService.logUserMessage(userId, sessionId, message, context);

    // 2. Forward to external AI
    try {
      const data = await aiService.forwardToExternalAi(message, context, userId, sessionId);
      const reply = data.reply || data;

      // 3. Log assistant response
      await aiService.logAssistantResponse(sessionId, reply);

      return res.status(200).json({ 
        success: true, 
        sessionId, 
        reply 
      });
    } catch (fetchError) {
      logger.error('Error reaching external AI service', fetchError);
      return res.status(502).json({ success: false, error: 'Third-party AI service unavailable' });
    }
  } catch (error) {
    logger.error('Failed to process AI chat request', error);
    res.status(500).json({ success: false, error: 'Internal setup failed for AI' });
  }
};

export const generateAiContent = async (req: Request, res: Response) => {
  try {
    const { type, prompt, metadata } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const content = await aiService.generateContent(userId, type, prompt, metadata);
    
    return res.status(201).json({
      success: true,
      data: content
    });
  } catch (error) {
    logger.error('Failed to generate AI content', error);
    res.status(500).json({ success: false, error: 'Content generation failed' });
  }
};

export const updateContentStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const updated = await aiService.updateContentStatus(id, status as 'approved' | 'rejected');
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    logger.error('Failed to update content status', error);
    res.status(500).json({ success: false, error: 'Update failed' });
  }
};
