import { Request, Response, NextFunction } from 'express';
import { reviewService } from './review.service';
import { successResponse } from '../../lib/response';

export class ReviewController {
  async addReview(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const courseId = req.params.courseId as string;

      const review = await reviewService.addReview(studentId, courseId, req.body);

      res.status(201).json(successResponse(review, { message: 'Review added successfully' }));
    } catch (error) {
      next(error);
    }
  }

  async getReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.courseId as string;
      const limit = parseInt((req.query.limit as string) || '20', 10);
      const offset = parseInt((req.query.offset as string) || '0', 10);

      const reviews = await reviewService.getReviews(courseId, limit, offset);

      res.status(200).json(successResponse(reviews, { message: 'Reviews retrieved' }));
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
