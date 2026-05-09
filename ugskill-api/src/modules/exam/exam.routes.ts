import { Router } from 'express';
import * as examController from './exam.controller';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createExamSchema,
  updateExamSchema,
  examQuerySchema,
  createSectionSchema,
  grantBatchAccessSchema,
  createQuestionSchema,
  questionQuerySchema,
  startAttemptSchema,
  saveIncrementalResponseSchema,
  submitAttemptSchema,
  resultQuerySchema,
  ingestExamProctoringEventSchema,
  examProctoringEventQuerySchema
} from './exam.schemas';

const router = Router();

// --- EXAM CRUD ---

router.post(
  '/',
  requireAuth,
  requireRole(['admin', 'creator', 'faculty']),
  validate(createExamSchema),
  examController.createExam
);

router.get(
  '/',
  requireAuth, // Any auth user can see published exams theoretically
  validate(examQuerySchema),
  examController.listExams
);

router.get(
  '/live',
  requireAuth,
  requireRole(['admin', 'super_admin', 'proctor', 'instructor', 'creator', 'faculty']),
  examController.listLiveExams
);

router.get(
  '/incidents/recent',
  requireAuth,
  requireRole(['admin', 'super_admin', 'proctor', 'instructor', 'creator', 'faculty']),
  examController.listRecentIncidents
);

router.post(
  '/attempts/:attemptId/flag',
  requireAuth,
  requireRole(['admin', 'super_admin', 'proctor', 'instructor']),
  examController.adminFlagAttempt
);

router.post(
  '/attempts/:attemptId/terminate',
  requireAuth,
  requireRole(['admin', 'super_admin', 'proctor', 'instructor']),
  examController.adminTerminateAttempt
);

router.get(
  '/:id',
  requireAuth,
  examController.getExam
);

router.get(
  '/:id/proctoring-report',
  requireAuth,
  requireRole(['admin', 'super_admin', 'proctor', 'instructor', 'creator', 'faculty']),
  examController.getProctoringReport
);

router.patch(
  '/:id',
  requireAuth,
  requireRole(['admin', 'creator', 'faculty']),
  validate(updateExamSchema),
  examController.updateExam
);

router.delete(
  '/:id',
  requireAuth,
  requireRole(['admin', 'creator', 'faculty']),
  examController.deleteExam
);

// --- SECTIONS & BATCH ACCESS ---

router.post(
  '/:id/sections',
  requireAuth,
  requireRole(['admin', 'creator', 'faculty']),
  validate(createSectionSchema),
  examController.addSection
);

router.post(
  '/:id/batch-access',
  requireAuth,
  requireRole(['admin']),
  validate(grantBatchAccessSchema),
  examController.grantBatchAccess
);

router.get(
  '/:id/batch-access',
  requireAuth,
  requireRole(['admin', 'creator', 'faculty']),
  examController.listBatchAccess
);

router.delete(
  '/:id/batch-access/:batchId',
  requireAuth,
  requireRole(['admin']),
  examController.revokeBatchAccess
);

// --- QUESTION BANK ---

router.post(
  '/questions',
  requireAuth,
  requireRole(['admin', 'creator', 'faculty']),
  validate(createQuestionSchema),
  examController.createQuestion
);

router.get(
  '/questions',
  requireAuth,
  requireRole(['admin', 'creator', 'faculty']),
  validate(questionQuerySchema),
  examController.listQuestions
);

// --- ATTEMPTS ---

router.post(
  '/:id/attempts/start',
  requireAuth,
  requireRole(['student', 'admin', 'super_admin', 'creator']),
  validate(startAttemptSchema),
  examController.startAttempt
);

router.patch(
  '/:id/attempts/:attemptId/answers',
  requireAuth,
  requireRole(['student', 'admin', 'super_admin', 'creator']),
  validate(saveIncrementalResponseSchema),
  examController.saveIncrementalResponse
);

router.post(
  '/:id/attempts/:attemptId/submit',
  requireAuth,
  requireRole(['student', 'admin', 'super_admin', 'creator']),
  validate(submitAttemptSchema),
  examController.submitAttempt
);

router.get(
  '/results/:attemptId',
  requireAuth, // Handled in controller to check ownership or admin
  examController.getResult
);

router.post(
  '/:id/attempts/:attemptId/terminate',
  requireAuth,
  requireRole(['admin', 'super_admin', 'proctor', 'instructor']),
  examController.adminTerminateAttempt
);

// --- PROCTORING ---

router.post(
  '/proctoring-events',
  requireAuth,
  validate(ingestExamProctoringEventSchema),
  examController.ingestProctoringEvent
);

router.get(
  '/proctoring-events',
  requireAuth,
  requireRole(['admin', 'proctor']),
  validate(examProctoringEventQuerySchema),
  examController.listProctoringEvents
);

export default router;
