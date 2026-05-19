import { Router } from 'express';
import { proctoringController } from './proctoring.controller';
import { requireAuth, requireRole } from '../../middleware/auth';

const router = Router();

// Student routes
router.post('/events', requireAuth, proctoringController.ingestEvent);
router.post('/analyze-frame', requireAuth, proctoringController.analyzeFrame);
router.post('/heartbeat', requireAuth, proctoringController.heartbeat);

// Admin routes
router.get('/attempts/:attemptId', requireAuth, requireRole(['admin', 'instructor']), proctoringController.getAttemptEvents);
router.get('/attempts/:attemptId/summary', requireAuth, requireRole(['admin', 'instructor']), proctoringController.getAttemptSummary);
router.post('/attempts/:attemptId/override', requireAuth, requireRole(['admin', 'instructor']), proctoringController.overrideViolation);
router.get('/incidents/recent', requireAuth, requireRole(['admin', 'instructor']), proctoringController.getRecentIncidents);

export const proctoringRoutes = router;
