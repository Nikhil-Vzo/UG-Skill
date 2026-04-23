import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { adminController } from './admin.controller';

const router = Router();

// Protect all /admin routes
router.use(requireAuth);
router.use(requireRole(['admin', 'super_admin']));

router.get('/stats', adminController.getStats);

export default router;
