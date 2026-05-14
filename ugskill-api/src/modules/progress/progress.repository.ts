import { db } from '../../config/postgres';
import { lectureCompletions, progressSummary, studentStreaks } from '../../db/pg/schema/lms';
import { eq, and, sql } from 'drizzle-orm';

export class ProgressRepository {
  async markLectureComplete(
    studentId: string,
    courseId: string,
    lectureId: string
  ) {
    // Check if already completed
    const existing = await db
      .select()
      .from(lectureCompletions)
      .where(
        and(
          eq(lectureCompletions.studentId, studentId),
          eq(lectureCompletions.courseId, courseId),
          eq(lectureCompletions.lectureId, lectureId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return { alreadyCompleted: true, record: existing[0] };
    }

    const [record] = await db
      .insert(lectureCompletions)
      .values({
        studentId,
        courseId,
        lectureId,
      })
      .returning();

    return { alreadyCompleted: false, record };
  }

  async upsertProgressSummary(
    studentId: string,
    courseId: string,
    totalLectures: number,
    lastLectureId: string
  ) {
    // Recalculate watch seconds or just increment count
    const [summary] = await db
      .insert(progressSummary)
      .values({
        studentId,
        courseId,
        lecturesCompleted: 1,
        totalLectures,
        lastLectureId,
        lastAccessedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [progressSummary.studentId, progressSummary.courseId],
        set: {
          lecturesCompleted: sql`${progressSummary.lecturesCompleted} + 1`,
          totalLectures,
          lastLectureId,
          lastAccessedAt: new Date(),
          recomputedAt: new Date(),
        },
      })
      .returning();

    return summary;
  }

  async getProgressSummary(studentId: string, courseId: string) {
    const summary = await db
      .select()
      .from(progressSummary)
      .where(
        and(
          eq(progressSummary.studentId, studentId),
          eq(progressSummary.courseId, courseId)
        )
      )
      .limit(1);

    return summary[0] || null;
  }

  async getCompletedLectureIds(studentId: string, courseId: string): Promise<string[]> {
    const rows = await db
      .select({ lectureId: lectureCompletions.lectureId })
      .from(lectureCompletions)
      .where(
        and(
          eq(lectureCompletions.studentId, studentId),
          eq(lectureCompletions.courseId, courseId)
        )
      );
    return rows.map(r => r.lectureId);
  }

  async upsertStudentStreak(studentId: string, activeDate: Date) {
    // Simple naive UPSERT to initialize or update lastActiveDate. 
    // Actual streak computation happens in service layer.
    const dateStr = activeDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Fetch existing streak first
    let streak = await this.getStudentStreak(studentId);
    
    if (!streak) {
      const [newStreak] = await db
        .insert(studentStreaks)
        .values({
          studentId,
          currentStreak: 1,
          bestStreak: 1,
          lastActiveDate: dateStr,
        })
        .returning();
      return newStreak;
    }

    // Returning existing allows service to manipulate and call a pure update method
    return streak;
  }

  async getStudentStreak(studentId: string) {
    const [streak] = await db
      .select()
      .from(studentStreaks)
      .where(eq(studentStreaks.studentId, studentId))
      .limit(1);
    return streak || null;
  }

  async updateStudentStreak(studentId: string, currentStreak: number, bestStreak: number, lastActiveDate: string) {
    const [updated] = await db
      .update(studentStreaks)
      .set({
        currentStreak,
        bestStreak,
        lastActiveDate,
        updatedAt: new Date(),
      })
      .where(eq(studentStreaks.studentId, studentId))
      .returning();
    return updated;
  }
}

export const progressRepository = new ProgressRepository();
