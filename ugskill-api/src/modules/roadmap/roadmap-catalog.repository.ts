import { db } from '../../config/postgres';
import { roadmapCatalog } from '../../db/pg/schema/lms';
import { eq, ilike, and, sql } from 'drizzle-orm';

export class RoadmapCatalogRepository {
  async upsertCatalog(id: string, data: Partial<typeof roadmapCatalog.$inferInsert>) {
    const insertData = { ...data, id } as typeof roadmapCatalog.$inferInsert;
    return await db.insert(roadmapCatalog)
      .values(insertData)
      .onConflictDoUpdate({
        target: roadmapCatalog.id,
        set: { ...data, updatedAt: sql`now()` }
      })
      .returning();
  }

  async getCatalogById(id: string) {
    const result = await db.select().from(roadmapCatalog).where(eq(roadmapCatalog.id, id));
    return result[0] || null;
  }

  async deleteCatalog(id: string) {
    return await db.delete(roadmapCatalog).where(eq(roadmapCatalog.id, id)).returning();
  }

  async searchRoadmaps(query?: string, filters?: { status?: string; isRestricted?: boolean; targetRole?: string }) {
    let conditions = [];

    if (query) {
      conditions.push(ilike(roadmapCatalog.title, `%${query}%`));
    }
    if (filters?.status) {
      conditions.push(eq(roadmapCatalog.status, filters.status));
    }
    if (filters?.isRestricted !== undefined) {
      conditions.push(eq(roadmapCatalog.isRestricted, filters.isRestricted));
    }
    if (filters?.targetRole) {
      conditions.push(eq(roadmapCatalog.targetRole, filters.targetRole));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db.select()
      .from(roadmapCatalog)
      .where(whereClause)
      .limit(50);
  }
}

export const roadmapCatalogRepo = new RoadmapCatalogRepository();
