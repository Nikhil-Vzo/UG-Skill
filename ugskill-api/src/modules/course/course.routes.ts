import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as courseController from './course.controller';

const router = Router();

// Public / Read-only endpoints
router.get('/', courseController.searchCourses); // Fallback for list queries matching /courses directly
router.get('/search', courseController.searchCourses);
router.get('/:id', courseController.getCourse);

// Strict protected endpoints for modification
router.use(requireAuth);
router.use(requireRole(['admin', 'creator']));

router.post('/', courseController.createCourse);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

// Sections & Lectures
router.post('/:id/sections', courseController.addSection);
router.post('/:id/sections/:sectionIdx/lectures', courseController.addLecture);

// Batch Access (Admin only typically, but allowing creator for now as per strict requirement)
router.post('/:id/batch-access', courseController.grantBatchAccess);

export default router;
