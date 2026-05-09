import { db } from '../../config/postgres';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { exams, examSections, examBatchAccess, examAttempts, examScores, examRankings, certificates } from '../../db/pg/schema';
import { AppError } from '../../lib/errors';

export class ExamRepository {
  async findById(id: string) {
    try {
      const result = await db.select().from(exams).where(eq(exams.id, id)).limit(1);
      return result[0];
    } catch (error: any) {
      throw new AppError(`Failed to find exam: ${error.message}`, 500);
    }
  }

  async findMany(filters: any = {}) {
    try {
      console.log('ExamRepository.findMany filters:', filters);
      const { status, creatorId, studentId, page = 1, limit = 10 } = filters;
      const offset = (page - 1) * limit;

      const conditions = [];

      if (status) conditions.push(eq(exams.status, status));
      if (creatorId) conditions.push(eq(exams.creatorId, creatorId));
      
      if (studentId) {
        // Only fetch exams where the student's batch has access
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM ${examBatchAccess} eba
            JOIN batch_members bm ON eba.batch_id = bm.batch_id
            WHERE eba.exam_id = ${exams.id} AND bm.user_id = ${studentId}
          )`
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const [data, totalCount] = await Promise.all([
        db.select().from(exams).where(whereClause).limit(limit).offset(offset).orderBy(desc(exams.createdAt)),
        db.select({ count: count() }).from(exams).where(whereClause)
      ]);

      return {
        data,
        pagination: {
          total: totalCount[0].count,
          page,
          limit,
          pages: Math.ceil(totalCount[0].count / limit)
        }
      };
    } catch (error: any) {
      throw new AppError(`Failed to list exams: ${error.message}`, 500);
    }
  }

  async create(data: any) {
    try {
      const result = await db.insert(exams).values(data).returning();
      return result[0];
    } catch (error: any) {
      throw new AppError(`Failed to create exam: ${error.message}`, 500);
    }
  }

  async update(id: string, data: any) {
    try {
      const result = await db.update(exams).set(data).where(eq(exams.id, id)).returning();
      return result[0];
    } catch (error: any) {
      throw new AppError(`Failed to update exam: ${error.message}`, 500);
    }
  }

  async delete(id: string) {
    try {
      await db.transaction(async (tx) => {
        await tx.delete(certificates).where(and(eq(certificates.certType, 'exam'), eq(certificates.referenceId, id)));
        await tx.delete(examScores).where(eq(examScores.examId, id));
        await tx.delete(examRankings).where(eq(examRankings.examId, id));
        await tx.delete(examAttempts).where(eq(examAttempts.examId, id));
        await tx.delete(examBatchAccess).where(eq(examBatchAccess.examId, id));
        await tx.delete(examSections).where(eq(examSections.examId, id));
        await tx.delete(exams).where(eq(exams.id, id));
      });
      return true;
    } catch (error: any) {
      throw new AppError(`Failed to delete exam: ${error.message}`, 500);
    }
  }

  // --- SECTIONS ---
  async createSection(data: any) {
    try {
      const result = await db.insert(examSections).values(data).returning();
      return result[0];
    } catch (error: any) {
      throw new AppError(`Failed to create section: ${error.message}`, 500);
    }
  }

  async findSectionsByExamId(examId: string) {
    try {
      return await db.select().from(examSections).where(eq(examSections.examId, examId)).orderBy(examSections.sectionOrder);
    } catch (error: any) {
      throw new AppError(`Failed to list sections: ${error.message}`, 500);
    }
  }

  // --- ACCESS ---
  async grantBatchAccess(examId: string, batchId: string, grantedBy?: string) {
    try {
      const result = await db.insert(examBatchAccess).values({ examId, batchId, grantedBy }).returning();
      return result[0];
    } catch (error: any) {
      throw new AppError(`Failed to grant batch access: ${error.message}`, 500);
    }
  }

  async listBatchAccess(examId: string) {
    try {
      return await db
        .select()
        .from(examBatchAccess)
        .where(eq(examBatchAccess.examId, examId));
    } catch (error: any) {
      throw new AppError(`Failed to list batch access: ${error.message}`, 500);
    }
  }

  async revokeBatchAccess(examId: string, batchId: string) {
    try {
      await db
        .delete(examBatchAccess)
        .where(and(eq(examBatchAccess.examId, examId), eq(examBatchAccess.batchId, batchId)));
      return true;
    } catch (error: any) {
      throw new AppError(`Failed to revoke batch access: ${error.message}`, 500);
    }
  }

  async hasBatchAccess(examId: string, batchId: string) {
    try {
      const result = await db
        .select()
        .from(examBatchAccess)
        .where(and(eq(examBatchAccess.examId, examId), eq(examBatchAccess.batchId, batchId)))
        .limit(1);
      return result.length > 0;
    } catch (error: any) {
      throw new AppError(`Failed to check batch access: ${error.message}`, 500);
    }
  }
}

export const examRepository = new ExamRepository();
