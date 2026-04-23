import { db } from '../../config/postgres';
import { enrollments, batchCourseAccess } from '../../db/pg/schema/lms';
import { eq, and } from 'drizzle-orm';

export class EnrollmentRepository {
  async enrollStudent(data: Partial<typeof enrollments.$inferInsert>) {
    return await db.insert(enrollments).values(data as any).returning();
  }

  async getEnrollment(studentId: string, enrollableType: string, enrollableId: string) {
    const result = await db.select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.enrollableType, enrollableType),
          eq(enrollments.enrollableId, enrollableId)
        )
      );
    return result[0] || null;
  }

  async getStudentEnrollments(studentId: string) {
    return await db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }

  async checkBatchAccess(batchId: string, contentType: string, contentId: string) {
    const access = await db.select()
      .from(batchCourseAccess)
      .where(
        and(
          eq(batchCourseAccess.batchId, batchId),
          eq(batchCourseAccess.contentType, contentType),
          eq(batchCourseAccess.contentId, contentId)
        )
      );

    if (access.length === 0) return false;

    // Check expiry
    const acc = access[0];
    if (acc.expiresAt && acc.expiresAt < new Date()) {
      return false;
    }
    return true;
  }
}

export const enrollmentRepo = new EnrollmentRepository();
