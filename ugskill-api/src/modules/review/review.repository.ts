import { db } from '../../config/postgres';
import { courseReviews } from '../../db/pg/schema/lms';
import { eq, and, desc } from 'drizzle-orm';

export class ReviewRepository {
  async saveReview(data: {
    studentId: string;
    courseId: string;
    rating: number;
    reviewText?: string;
  }) {
    // Check if review already exists
    const existing = await db
      .select({ id: courseReviews.id })
      .from(courseReviews)
      .where(
        and(
          eq(courseReviews.studentId, data.studentId),
          eq(courseReviews.courseId, data.courseId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing review
      const [updated] = await db
        .update(courseReviews)
        .set({
          rating: data.rating,
          reviewText: data.reviewText || null,
          updatedAt: new Date(),
        })
        .where(eq(courseReviews.id, existing[0].id))
        .returning();
      return updated;
    }

    // Insert new review
    const [review] = await db
      .insert(courseReviews)
      .values({
        studentId: data.studentId,
        courseId: data.courseId,
        rating: data.rating,
        reviewText: data.reviewText || null,
        status: 'published',
      })
      .returning();

    return review;
  }

  async getReviewsByCourseId(courseId: string, limit: number = 20, offset: number = 0) {
    return await db
      .select()
      .from(courseReviews)
      .where(
        and(
          eq(courseReviews.courseId, courseId),
          eq(courseReviews.status, 'published')
        )
      )
      .orderBy(desc(courseReviews.createdAt))
      .limit(limit)
      .offset(offset);
  }
}

export const reviewRepository = new ReviewRepository();
