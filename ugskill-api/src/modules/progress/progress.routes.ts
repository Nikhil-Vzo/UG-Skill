import { Router } from 'express';
import { progressController } from './progress.controller';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { completeLectureSchema, getProgressSummarySchema } from './progress.schemas';

const router = Router();

// All progress routes require authentication
router.use(requireAuth);

router.post(
  '/lectures/:courseId/:lectureId/complete',
  validate(completeLectureSchema),
  progressController.completeLecture.bind(progressController)
);

router.get(
  '/summary/:courseId',
  validate(getProgressSummarySchema),
  progressController.getSummary.bind(progressController)
);

router.get(
  '/streak',
  progressController.getStreak.bind(progressController)
);

export const progressRoutes = router;
