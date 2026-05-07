import { Router } from 'express';
import { quizController } from './quiz.controller';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createQuizDefinitionSchema, updateQuizDefinitionSchema, submitQuizAttemptSchema } from './quiz.schemas';

const router = Router();

// Public / read-only
router.get('/', requireAuth, quizController.listDefinitions.bind(quizController));
router.get('/:quizId', requireAuth, quizController.getDefinition.bind(quizController));

// Student routes
router.post(
  '/:quizId/attempts',
  requireAuth,
  validate(submitQuizAttemptSchema),
  quizController.submitAttempt.bind(quizController)
);

router.post(
  '/:quizId/attempt',
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

router.put(
  '/:quizId',
  requireAuth,
  requireRole(['admin', 'creator']),
  validate(updateQuizDefinitionSchema),
  quizController.updateDefinition.bind(quizController)
);

export const quizRoutes = router;
