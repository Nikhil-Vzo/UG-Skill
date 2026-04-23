import { db } from '../../config/postgres';
import { assignmentSubmissions } from '../../db/pg/schema/lms';
import { eq, and, desc } from 'drizzle-orm';

export class AssignmentRepository {
  async saveSubmission(data: {
    studentId: string;
    courseId: string;
    assignmentId: string;
    fileUrls?: string[];
    textContent?: string;
  }) {
    // Check previous attempts
    const prevs = await db
      .select({ attemptNumber: assignmentSubmissions.attemptNumber })
      .from(assignmentSubmissions)
      .where(
        and(
          eq(assignmentSubmissions.studentId, data.studentId),
          eq(assignmentSubmissions.assignmentId, data.assignmentId)
        )
      )
      .orderBy(desc(assignmentSubmissions.attemptNumber))
      .limit(1);

    const attemptNumber = prevs.length > 0 ? (prevs[0].attemptNumber || 0) + 1 : 1;

    const [submission] = await db
      .insert(assignmentSubmissions)
      .values({
        studentId: data.studentId,
        courseId: data.courseId,
        assignmentId: data.assignmentId,
        fileUrls: data.fileUrls || [],
        textContent: data.textContent || null,
        attemptNumber,
        status: 'submitted',
      })
      .returning();

    return submission;
  }

  async getSubmissionById(submissionId: string) {
    const [sub] = await db
      .select()
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.id, submissionId))
      .limit(1);
    return sub || null;
  }

  async gradeSubmission(
    submissionId: string,
    gradedBy: string,
    data: { score: number; maxScore: number; feedback?: string; status?: string }
  ) {
    const [sub] = await db
      .update(assignmentSubmissions)
      .set({
        score: data.score.toString(),
        maxScore: data.maxScore.toString(),
        feedback: data.feedback || null,
        status: data.status || 'graded',
        gradedBy,
        gradedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(assignmentSubmissions.id, submissionId))
      .returning();
    return sub;
  }
}

export const assignmentRepository = new AssignmentRepository();
