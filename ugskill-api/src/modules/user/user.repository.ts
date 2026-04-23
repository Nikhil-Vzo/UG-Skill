import { eq, and, isNull, ilike, sql, inArray } from 'drizzle-orm';
import { db } from '../../config/postgres';
import { users } from '../../db/pg/schema/core';
import { getOffset } from '../../lib/pagination';

export const findById = async (id: string) => {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);

  return result[0] || null;
};

export interface ListUsersFilters {
  role?: string;
  status?: string;
  search?: string;
}

export const findAll = async (
  filters: ListUsersFilters,
  page: number,
  perPage: number
) => {
  const conditions = [isNull(users.deletedAt)];

  if (filters.status) {
    conditions.push(eq(users.status, filters.status));
  }

  if (filters.search) {
    conditions.push(ilike(users.fullName, `%${filters.search}%`));
  }

  // For role filtering, we use the array contains operator
  // Drizzle doesn't have a built-in array contains, so we use sql
  if (filters.role) {
    conditions.push(sql`${users.roles} @> ARRAY[${filters.role}]::TEXT[]`);
  }

  const whereClause = and(...conditions);

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        emailVerified: users.emailVerified,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        phone: users.phone,
        roles: users.roles,
        institution: users.institution,
        branch: users.branch,
        cgpa: users.cgpa,
        graduationYear: users.graduationYear,
        status: users.status,
        lastLoginAt: users.lastLoginAt,
        loginCount: users.loginCount,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .limit(perPage)
      .offset(getOffset(page, perPage))
      .orderBy(users.createdAt),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause),
  ]);

  return { data, total: countResult[0]?.count ?? 0 };
};

export const updateUser = async (id: string, data: Record<string, any>) => {
  const result = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning();

  return result[0] || null;
};

export const softDeleteUser = async (id: string) => {
  const result = await db
    .update(users)
    .set({ deletedAt: new Date(), status: 'deleted', updatedAt: new Date() })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning();

  return result[0] || null;
};
