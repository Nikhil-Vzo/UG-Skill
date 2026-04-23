import { db } from '../../config/postgres';
import { quizAttempts } from '../../db/pg/schema/lms';
import { eq, and, desc } from 'drizzle-orm';

export class QuizAttemptRepository {
  async saveAttempt(data: {
    studentId: string;
    quizId: string;
    courseId: string;
    attemptNumber: number;
    score: number;
    maxScore: number;
    passed: boolean;
    timeTakenSecs: number;
  }) {
    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        studentId: data.studentId,
        quizId: data.quizId,
        courseId: data.courseId,
        attemptNumber: data.attemptNumber,
        score: data.score.toString(), // numeric requires string mapping in strict drizzle maps sometimes
        maxScore: data.maxScore.toString(),
        passed: data.passed,
        timeTakenSecs: data.timeTakenSecs,
      })
      .returning();

    return attempt;
  }

  async getLatestAttemptNumber(studentId: string, quizId: string): Promise<number> {
    const attempts = await db
      .select({ attemptNumber: quizAttempts.attemptNumber })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.studentId, studentId),
          eq(quizAttempts.quizId, quizId)
        )
      )
      .orderBy(desc(quizAttempts.attemptNumber))
      .limit(1);

    return attempts.length > 0 ? attempts[0].attemptNumber : 0;
  }
}

export const quizAttemptRepository = new QuizAttemptRepository();
