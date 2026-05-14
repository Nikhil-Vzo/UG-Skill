import { Router } from 'express';
import * as uploadController from './upload.controller';
import { requireAuth } from '../../middleware/auth';
import { uploadLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Apply auth and rate limiting to all upload routes
router.use(requireAuth);
router.use(uploadLimiter);

/**
 * @route   POST /api/v1/upload/presigned
 * @desc    Generate a presigned URL to securely upload a file to Supabase Storage
 * @access  Private (Role and category dependent)
 */
router.post('/presigned', uploadController.generateUploadUrl);
router.get('/sign', uploadController.signUrl);

export default router;
