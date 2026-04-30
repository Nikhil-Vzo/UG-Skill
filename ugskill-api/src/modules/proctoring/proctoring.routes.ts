import { Router } from 'express';
import { proctoringController } from './proctoring.controller';
import { requireAuth, requireRole } from '../../middleware/auth';

const router = Router();

// Student routes
router.post('/events', requireAuth, proctoringController.ingestEvent);
router.post('/analyze-frame', requireAuth, proctoringController.analyzeFrame);

// Admin routes
router.get('/attempts/:attemptId', requireAuth, requireRole(['admin', 'instructor']), proctoringController.getAttemptEvents);
router.get('/incidents/recent', requireAuth, requireRole(['admin', 'instructor']), proctoringController.getRecentIncidents);

export const proctoringRoutes = router;
