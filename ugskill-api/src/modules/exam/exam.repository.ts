import { eq, and, desc, isNull, count } from 'drizzle-orm';
import { db } from '../../config/postgres';
import { exams, examSections, examBatchAccess } from '../../db/pg/schema/exam';
import { AppError, NotFoundError } from '../../lib/errors';

export class ExamRepository {
  async create(data: Partial<typeof exams.$inferInsert>) {
    try {
      const [exam] = await db.insert(exams).values(data as any).returning();
      return exam;
    } catch (error: any) {
      throw new AppError(`Failed to create exam: ${error.message}`, 500);
    }
  }

  async findById(id: string) {
    try {
      const [exam] = await db
        .select()
        .from(exams)
        .where(eq(exams.id, id))
        .limit(1);
      return exam || null;
    } catch (error: any) {
      throw new AppError(`Failed to find exam: ${error.message}`, 500);
    }
  }

  async findMany(filters: { status?: string; category?: string; difficulty?: string; mode?: string; page?: number; limit?: number }) {
    try {
      const page = Math.max(1, Number(filters.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      conditions.push(isNull(exams.deletedAt));

      if (filters.status) conditions.push(eq(exams.status, filters.status));
      if (filters.category) conditions.push(eq(exams.category, filters.category));
      if (filters.difficulty) conditions.push(eq(exams.difficulty, filters.difficulty));
      if (filters.mode) conditions.push(eq(exams.mode, filters.mode));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, [countResult]] = await Promise.all([
        db
          .select()
          .from(exams)
          .where(whereClause)
          .orderBy(desc(exams.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(exams).where(whereClause)
      ]);

      return {
        data: items,
        meta: {
          total: Number(countResult.count),
          page,
          limit,
          totalPages: Math.ceil(Number(countResult.count) / limit)
        }
      };
    } catch (error: any) {
      throw new AppError(`Failed to list exams: ${error.message}`, 500);
    }
  }

  async update(id: string, data: Partial<typeof exams.$inferInsert>) {
    try {
      const [updated] = await db
        .update(exams)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(exams.id, id))
        .returning();
      
      if (!updated) {
        throw new NotFoundError('Exam not found');
      }
      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError(`Failed to update exam: ${error.message}`, 500);
    }
  }

  async softDelete(id: string) {
    try {
      const [deleted] = await db
        .update(exams)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(exams.id, id))
        .returning();
      return !!deleted;
    } catch (error: any) {
      throw new AppError(`Failed to delete exam: ${error.message}`, 500);
    }
  }

  // --- SECTIONS ---

  async createSection(data: typeof examSections.$inferInsert) {
    try {
      const [section] = await db.insert(examSections).values(data).returning();
      return section;
    } catch (error: any) {
      throw new AppError(`Failed to create exam section: ${error.message}`, 500);
    }
  }

  // --- BATCH ACCESS ---

  async grantBatchAccess(examId: string, batchId: string, grantedBy?: string) {
    try {
      const [access] = await db
        .insert(examBatchAccess)
        .values({ examId, batchId, grantedBy })
        .onConflictDoNothing()
        .returning();
      return access;
    } catch (error: any) {
      throw new AppError(`Failed to grant batch access: ${error.message}`, 500);
    }
  }

  async revokeBatchAccess(examId: string, batchId: string) {
    try {
      const [deleted] = await db
        .delete(examBatchAccess)
        .where(and(eq(examBatchAccess.examId, examId), eq(examBatchAccess.batchId, batchId)))
        .returning();
      return !!deleted;
    } catch (error: any) {
      throw new AppError(`Failed to revoke batch access: ${error.message}`, 500);
    }
  }

  async hasBatchAccess(examId: string, batchId: string) {
    try {
      const access = await db.query.examBatchAccess.findFirst({
        where: and(eq(examBatchAccess.examId, examId), eq(examBatchAccess.batchId, batchId))
      });
      return !!access;
    } catch (error: any) {
      throw new AppError(`Failed to check batch access: ${error.message}`, 500);
    }
  }
}

export const examRepository = new ExamRepository();
