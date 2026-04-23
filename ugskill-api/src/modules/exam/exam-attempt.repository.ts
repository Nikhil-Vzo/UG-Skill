import { eq, and, desc, asc, count, sql } from 'drizzle-orm';
import { db } from '../../config/postgres';
import { examAttempts, examScores, examRankings } from '../../db/pg/schema/exam';
import { AppError, NotFoundError } from '../../lib/errors';

export class ExamAttemptRepository {
  async createAttempt(data: typeof examAttempts.$inferInsert) {
    try {
      const [attempt] = await db.insert(examAttempts).values(data).returning();
      return attempt;
    } catch (error: any) {
      throw new AppError(`Failed to create exam attempt: ${error.message}`, 500);
    }
  }

  async findAttemptById(id: string) {
    try {
      const [attempt] = await db
        .select()
        .from(examAttempts)
        .where(eq(examAttempts.id, id))
        .limit(1);
      if (!attempt) {
        throw new NotFoundError('Exam attempt not found');
      }
      return attempt;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError(`Failed to find exam attempt: ${error.message}`, 500);
    }
  }

  async updateAttempt(id: string, data: Partial<typeof examAttempts.$inferInsert>) {
    try {
      const [updated] = await db
        .update(examAttempts)
        .set(data)
        .where(eq(examAttempts.id, id))
        .returning();
      
      if (!updated) {
        throw new NotFoundError('Exam attempt not found');
      }
      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError(`Failed to update exam attempt: ${error.message}`, 500);
    }
  }

  async incrementViolation(id: string) {
    try {
      const [updated] = await db
        .update(examAttempts)
        .set({ violationCount: sql`${examAttempts.violationCount} + 1` })
        .where(eq(examAttempts.id, id))
        .returning();
      return updated;
    } catch (error: any) {
      throw new AppError(`Failed to increment violation: ${error.message}`, 500);
    }
  }

  async getAttemptCount(studentId: string, examId: string) {
    try {
      const [result] = await db
        .select({ value: count() })
        .from(examAttempts)
        .where(and(eq(examAttempts.studentId, studentId), eq(examAttempts.examId, examId)));
      return result.value;
    } catch (error: any) {
      throw new AppError(`Failed to count exam attempts: ${error.message}`, 500);
    }
  }

  async findManyAttempts(filters: { studentId?: string; examId?: string; status?: string; page?: number; limit?: number }) {
    try {
      const page = Math.max(1, Number(filters.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (filters.studentId) conditions.push(eq(examAttempts.studentId, filters.studentId));
      if (filters.examId) conditions.push(eq(examAttempts.examId, filters.examId));
      if (filters.status) conditions.push(eq(examAttempts.status, filters.status));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, [{ value }]] = await Promise.all([
        db
          .select()
          .from(examAttempts)
          .where(whereClause)
          .orderBy(desc(examAttempts.startedAt))
          .limit(limit)
          .offset(offset),
        db.select({ value: count() }).from(examAttempts).where(whereClause)
      ]);

      return {
        data: items,
        meta: {
          total: Number(value),
          page,
          limit,
          totalPages: Math.ceil(Number(value) / limit)
        }
      };
    } catch (error: any) {
      throw new AppError(`Failed to list exam attempts: ${error.message}`, 500);
    }
  }

  // --- SCORES ---

  async createScore(data: typeof examScores.$inferInsert) {
    try {
      const [score] = await db.insert(examScores).values(data).returning();
      return score;
    } catch (error: any) {
      throw new AppError(`Failed to create exam score: ${error.message}`, 500);
    }
  }

  async getScoreByAttempt(attemptId: string) {
    try {
      const [score] = await db
        .select()
        .from(examScores)
        .where(eq(examScores.attemptId, attemptId))
        .limit(1);
      return score || null;
    } catch (error: any) {
      throw new AppError(`Failed to find exam score: ${error.message}`, 500);
    }
  }

  // --- RANKINGS ---

  async upsertRanking(data: typeof examRankings.$inferInsert) {
    try {
      const [ranking] = await db.insert(examRankings).values(data)
        .onConflictDoNothing()
        .returning();
      return ranking;
    } catch (error: any) {
      throw new AppError(`Failed to upsert exam ranking: ${error.message}`, 500);
    }
  }

  async findRankings(examId: string, limitVal: number = 100) {
    try {
      return await db
        .select()
        .from(examRankings)
        .where(eq(examRankings.examId, examId))
        .orderBy(asc(examRankings.rank))
        .limit(limitVal);
    } catch (error: any) {
      throw new AppError(`Failed to find exam rankings: ${error.message}`, 500);
    }
  }
}

export const examAttemptRepository = new ExamAttemptRepository();
