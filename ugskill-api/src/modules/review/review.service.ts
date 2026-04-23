import { reviewRepository } from './review.repository';
// import { enrollmentRepository } from '../enrollment/enrollment.repository';

export class ReviewService {
  async addReview(studentId: string, courseId: string, payload: { rating: number; reviewText?: string }) {
    // Optionally: Verify the student is enrolled in this course
    // const hasAccess = await enrollmentRepository.hasAccess(studentId, 'course', courseId);
    // if (!hasAccess) throw new AppError('Must be enrolled to review', 403);

    const review = await reviewRepository.saveReview({
      studentId,
      courseId,
      rating: payload.rating,
      reviewText: payload.reviewText,
    });
    
    // Note: We might also want to trigger an update to the course_catalog avg_rating here.
    return review;
  }

  async getReviews(courseId: string, limit?: number, offset?: number) {
    return await reviewRepository.getReviewsByCourseId(courseId, limit, offset);
  }
}

export const reviewService = new ReviewService();
