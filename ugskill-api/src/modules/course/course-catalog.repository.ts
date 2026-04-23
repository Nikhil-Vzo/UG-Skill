import { db } from '../../config/postgres';
import { courseCatalog } from '../../db/pg/schema/lms';
import { eq, ilike, and, sql } from 'drizzle-orm';

export class CourseCatalogRepository {
  async upsertCatalog(id: string, data: Partial<typeof courseCatalog.$inferInsert>) {
    const insertData = { ...data, id } as typeof courseCatalog.$inferInsert;
    return await db.insert(courseCatalog)
      .values(insertData)
      .onConflictDoUpdate({
        target: courseCatalog.id,
        set: { ...data, updatedAt: sql`now()` }
      })
      .returning();
  }

  async getCatalogById(id: string) {
    const result = await db.select().from(courseCatalog).where(eq(courseCatalog.id, id));
    return result[0] || null;
  }

  async deleteCatalog(id: string) {
    return await db.delete(courseCatalog).where(eq(courseCatalog.id, id)).returning();
  }

  async searchCourses(query?: string, filters?: { status?: string, category?: string }) {
    let conditions = [];

    if (query) {
      conditions.push(ilike(courseCatalog.title, `%${query}%`));
    }
    if (filters?.status) {
      conditions.push(eq(courseCatalog.status, filters.status));
    }
    if (filters?.category) {
      conditions.push(eq(courseCatalog.category, filters.category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db.select()
      .from(courseCatalog)
      .where(whereClause)
      .limit(50);
  }
}

export const courseCatalogRepo = new CourseCatalogRepository();
