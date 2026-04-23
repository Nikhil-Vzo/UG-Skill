import { db } from '../../config/postgres';
import { batchCourseAccess } from '../../db/pg/schema/lms';
import { eq, and } from 'drizzle-orm';

export class BatchAccessRepository {
  async grantAccess(batchId: string, contentType: string, contentId: string, grantedBy: string, expiresAt?: string) {
    const data = {
      batchId,
      contentType,
      contentId,
      grantedBy,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    };
    return await db.insert(batchCourseAccess).values(data).returning();
  }

  async revokeAccess(id: string) {
    return await db.delete(batchCourseAccess).where(eq(batchCourseAccess.id, id)).returning();
  }

  async checkAccess(batchId: string, contentType: string, contentId: string) {
    const result = await db.select()
      .from(batchCourseAccess)
      .where(
        and(
          eq(batchCourseAccess.batchId, batchId),
          eq(batchCourseAccess.contentType, contentType),
          eq(batchCourseAccess.contentId, contentId)
        )
      );
    return result[0] || null;
  }
}

export const batchAccessRepo = new BatchAccessRepository();
