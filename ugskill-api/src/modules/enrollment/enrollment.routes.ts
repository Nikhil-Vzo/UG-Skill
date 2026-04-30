import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as enrollmentController from './enrollment.controller';

const router = Router();

// All enrollment routes require authentication
router.use(requireAuth);

router.post('/', enrollmentController.enroll);
router.get('/mine', enrollmentController.getMyEnrollments);
router.get('/my-enrollments', enrollmentController.getMyEnrollments);
router.get('/check-access/:type/:id', enrollmentController.checkAccess);

export default router;
