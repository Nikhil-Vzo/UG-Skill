import { Router } from 'express';
import * as AI from './ai.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// AI endpoints require authentication
router.post('/chat', requireAuth, AI.handleAiChat);
router.post('/generate', requireAuth, AI.generateAiContent);
router.patch('/content/:id/status', requireAuth, AI.updateContentStatus);

export { router as aiRouter };
