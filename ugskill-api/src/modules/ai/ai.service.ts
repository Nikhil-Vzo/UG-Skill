import { AiChatSessionModel, AiGeneratedContentModel } from './ai.schemas';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';

const AI_EXTERNAL_URL = env.AI_EXTERNAL_URL || 'https://external-ai-api.ugskill.com/v1/chat';

export class AiService {
  async logUserMessage(userId: string, sessionId: string, message: string, context?: any) {
    return await AiChatSessionModel.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: { userId, status: 'active' },
        $push: {
          messages: {
            role: 'user',
            content: message,
            context,
            timestamp: new Date()
          }
        }
      },
      { upsert: true, new: true }
    );
  }

  async logAssistantResponse(sessionId: string, reply: string) {
    return await AiChatSessionModel.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          messages: {
            role: 'assistant',
            content: reply,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
  }

  async forwardToExternalAi(message: string, context: any, userId: string, sessionId: string) {
    try {
      const response = await fetch(AI_EXTERNAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context, userId, sessionId })
      });

      if (!response.ok) {
        throw new Error(`External AI API returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('External AI fetch failed', error);
      throw error;
    }
  }

  async generateContent(userId: string, type: string, prompt: string, metadata?: any) {
    // This would normally call an AI to generate content
    // For now, we simulate generation and log it for review
    const content = `Generated ${type} content for prompt: ${prompt}`;
    
    return await AiGeneratedContentModel.create({
      userId,
      type,
      prompt,
      content,
      metadata,
      status: 'pending_review'
    });
  }

  async updateContentStatus(contentId: string, status: 'approved' | 'rejected') {
    return await AiGeneratedContentModel.findByIdAndUpdate(contentId, { status }, { new: true });
  }

  async getChatHistory(sessionId: string) {
    return await AiChatSessionModel.findOne({ sessionId });
  }
}

export const aiService = new AiService();
