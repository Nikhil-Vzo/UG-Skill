import { Router } from 'express';
import { reviewController } from './review.controller';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createReviewSchema, getReviewsSchema } from './review.schemas';

const router = Router();

router.post(
  '/:courseId',
  requireAuth,
  validate(createReviewSchema),
  reviewController.addReview.bind(reviewController)
);

router.get(
  '/:courseId',
  validate(getReviewsSchema),
  reviewController.getReviews.bind(reviewController)
);

export const reviewRoutes = router;
