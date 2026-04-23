import { Router } from 'express';
import { quizController } from './quiz.controller';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createQuizDefinitionSchema, submitQuizAttemptSchema } from './quiz.schemas';

const router = Router();

// Student routes
router.post(
  '/:quizId/attempts',
  requireAuth,
  validate(submitQuizAttemptSchema),
  quizController.submitAttempt.bind(quizController)
);

// Creator routes
router.post(
  '/',
  requireAuth,
  requireRole(['admin', 'creator']),
  validate(createQuizDefinitionSchema),
  quizController.createDefinition.bind(quizController)
);

export const quizRoutes = router;
