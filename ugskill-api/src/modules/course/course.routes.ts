import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as courseController from './course.controller';
import { progressController } from '../progress/progress.controller';
import { reviewController } from '../review/review.controller';
import { validate } from '../../middleware/validate';
import { createReviewSchema, getReviewsSchema } from '../review/review.schemas';

const router = Router();

// ── Public / Read-only ──────────────────────────────────────────
router.get('/', courseController.searchCourses);
router.get('/search', courseController.searchCourses);

// Specific sub-resource routes MUST come before the /:id wildcard
router.get('/:courseId/lectures/:lectureId', requireAuth, courseController.getLecture);
router.post('/:courseId/lectures/:lectureId/complete', requireAuth, progressController.completeLecture.bind(progressController));
router.get('/:courseId/progress', requireAuth, progressController.getSummary.bind(progressController));
router.get('/:courseId/reviews', validate(getReviewsSchema), reviewController.getReviews.bind(reviewController));
router.post('/:courseId/reviews', requireAuth, validate(createReviewSchema), reviewController.addReview.bind(reviewController));

// Wildcard /:id MUST be last in the public block — it would swallow all of the above if placed earlier
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
