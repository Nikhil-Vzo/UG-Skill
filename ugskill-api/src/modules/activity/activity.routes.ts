import { Router } from 'express';
import { ingestEvents } from './activity.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// Uses auth but doesn't strictly fail if missing (some activity like pageviews might be anonymous)
// In a real scenario, you might want a `authenticateOptional` middleware
router.post('/ingest', requireAuth, ingestEvents);

export { router as activityRouter };
