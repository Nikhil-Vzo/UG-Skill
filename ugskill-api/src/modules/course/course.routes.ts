import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as courseController from './course.controller';

const router = Router();

// ── Public / Read-only ──────────────────────────────────────────
router.get('/', courseController.searchCourses);
router.get('/search', courseController.searchCourses);
router.get('/:id', courseController.getCourse); // Allow students to view course details

// ── Protected modification routes ───────────────────────────────
router.use(requireAuth);
router.use(requireRole(['admin', 'creator']));

router.post('/', courseController.createCourse);

// Sections & Lectures — MUST come before /:id wildcard
router.put('/:id/sections', courseController.replaceSections);
router.post('/:id/sections', courseController.addSection);
router.post('/:id/sections/:sectionIdx/lectures', courseController.addLecture);
router.post('/:id/batch-access', courseController.grantBatchAccess);

// PATCH / PUT / DELETE on a single course
router.patch('/:id', courseController.updateCourse);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

export default router;
