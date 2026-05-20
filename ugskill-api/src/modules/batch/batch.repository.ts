import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '../../config/postgres';
import { batches, batchMembers, users } from '../../db/pg/schema/core';
import { batchCourseAccess, courseCatalog } from '../../db/pg/schema/lms';
import { getOffset } from '../../lib/pagination';

// ─── Batch CRUD ──────────────────────────────────────────

export const createBatch = async (data: {
  name: string;
  institution?: string;
  year?: number;
  description?: string;
  expiresAt?: string;
  createdBy: string;
}) => {
  const result = await db
    .insert(batches)
    .values({
      name: data.name,
      institution: data.institution || null,
      year: data.year || null,
      description: data.description || null,
      createdBy: data.createdBy,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    })
    .returning();

  return result[0];
};

export const findBatchById = async (id: string) => {
  const result = await db
    .select()
    .from(batches)
    .where(and(eq(batches.id, id), isNull(batches.deletedAt)))
    .limit(1);

  return result[0] || null;
};

export const findAllBatches = async (page: number, perPage: number) => {
  const whereClause = isNull(batches.deletedAt);

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: batches.id,
        name: batches.name,
        institution: batches.institution,
        year: batches.year,
        description: batches.description,
        status: batches.status,
        createdBy: batches.createdBy,
        expiresAt: batches.expiresAt,
        createdAt: batches.createdAt,
        updatedAt: batches.updatedAt,
        deletedAt: batches.deletedAt,
        memberCount: sql<number>`count(distinct ${batchMembers.userId})::int`,
      })
      .from(batches)
      .leftJoin(batchMembers, and(
        eq(batches.id, batchMembers.batchId),
        isNull(batchMembers.removedAt)
      ))
      .where(whereClause)
      .groupBy(batches.id)
      .limit(perPage)
      .offset(getOffset(page, perPage))
      .orderBy(batches.createdAt),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(batches)
      .where(whereClause),
  ]);

  return { data, total: countResult[0]?.count ?? 0 };
};

export const updateBatch = async (id: string, data: Record<string, any>) => {
  const result = await db
    .update(batches)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(batches.id, id), isNull(batches.deletedAt)))
    .returning();

  return result[0] || null;
};

export const softDeleteBatch = async (id: string) => {
  const result = await db
    .update(batches)
    .set({ deletedAt: new Date(), status: 'archived', updatedAt: new Date() })
    .where(and(eq(batches.id, id), isNull(batches.deletedAt)))
    .returning();

  return result[0] || null;
};

// ─── Batch Members ───────────────────────────────────────

export const addMembers = async (batchId: string, userIds: string[], role: string) => {
  const values = userIds.map((userId) => ({
    batchId,
    userId,
    role,
  }));

  const result = await db.insert(batchMembers).values(values).returning();
  return result;
};

export const removeMember = async (batchId: string, userId: string) => {
  const result = await db
    .update(batchMembers)
    .set({ removedAt: new Date() })
    .where(
      and(
        eq(batchMembers.batchId, batchId),
        eq(batchMembers.userId, userId),
        isNull(batchMembers.removedAt)
      )
    )
    .returning();

  return result[0] || null;
};

export const findBatchMembers = async (batchId: string) => {
  const result = await db
    .select({
      id: batchMembers.id,
      userId: batchMembers.userId,
      role: batchMembers.role,
      joinedAt: batchMembers.joinedAt,
      userName: users.fullName,
      userEmail: users.email,
    })
    .from(batchMembers)
    .innerJoin(users, eq(batchMembers.userId, users.id))
    .where(
      and(
        eq(batchMembers.batchId, batchId),
        isNull(batchMembers.removedAt)
      )
    )
    .orderBy(batchMembers.joinedAt);

  return result;
};

export const grantCourseAccess = async (batchId: string, courseId: string, grantedBy: string) => {
  const result = await db.insert(batchCourseAccess).values({
    batchId,
    contentType: 'course',
    contentId: courseId,
    grantedBy,
  }).returning();

  return result[0];
};

export const findBatchCourseAccess = async (batchId: string) => {
  const result = await db
    .select({
      id: batchCourseAccess.id,
      courseId: batchCourseAccess.contentId,
      grantedAt: batchCourseAccess.grantedAt,
      expiresAt: batchCourseAccess.expiresAt,
      courseTitle: courseCatalog.title,
    })
    .from(batchCourseAccess)
    .leftJoin(courseCatalog, eq(batchCourseAccess.contentId, courseCatalog.id))
    .where(
      and(
        eq(batchCourseAccess.batchId, batchId),
        eq(batchCourseAccess.contentType, 'course')
      )
    );
  return result;
};

export const revokeCourseAccess = async (batchId: string, courseId: string) => {
  const result = await db
    .delete(batchCourseAccess)
    .where(
      and(
        eq(batchCourseAccess.batchId, batchId),
        eq(batchCourseAccess.contentType, 'course'),
        eq(batchCourseAccess.contentId, courseId)
      )
    )
    .returning();
  return result[0] || null;
};
