import { Router } from 'express';
import { assignmentController } from './assignment.controller';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { gradeAssignmentSchema, submitAssignmentSchema } from './assignment.schemas';

const router = Router();

// Student routes
router.get(
  '/:courseId/:assignmentId',
  requireAuth,
  assignmentController.getDetails.bind(assignmentController)
);

router.post(
  '/:courseId/:assignmentId/submit',
  requireAuth,
  validate(submitAssignmentSchema),
  assignmentController.submit.bind(assignmentController)
);

router.put(
  '/:courseId/:assignmentId/submit',
  requireAuth,
  validate(submitAssignmentSchema),
  assignmentController.submit.bind(assignmentController)
);

// Instructor routes
router.put(
  '/submissions/:submissionId/grade',
  requireAuth,
  requireRole(['admin', 'creator']),
  validate(gradeAssignmentSchema),
  assignmentController.grade.bind(assignmentController)
);

export const assignmentRoutes = router;
