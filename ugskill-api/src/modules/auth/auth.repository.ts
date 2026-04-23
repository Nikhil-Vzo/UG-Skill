import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '../../config/postgres';
import { users, userSessions } from '../../db/pg/schema/core';

// ─── User queries ────────────────────────────────────────

export const findUserByEmail = async (email: string) => {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);

  return result[0] || null;
};

export const findUserByResetToken = async (token: string) => {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.passwordResetToken, token), isNull(users.deletedAt)))
    .limit(1);

  return result[0] || null;
};

export const findUserById = async (id: string) => {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);

  return result[0] || null;
};

export interface CreateUserParams {
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  institution?: string;
  branch?: string;
  graduationYear?: number;
}

export const createUser = async (data: CreateUserParams) => {
  const result = await db
    .insert(users)
    .values({
      email: data.email,
      passwordHash: data.passwordHash,
      fullName: data.fullName,
      phone: data.phone || null,
      institution: data.institution || null,
      branch: data.branch || null,
      graduationYear: data.graduationYear || null,
    })
    .returning();

  return result[0];
};

export const updateUserPassword = async (userId: string, passwordHash: string) => {
  await db
    .update(users)
    .set({ 
      passwordHash, 
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      updatedAt: new Date() 
    })
    .where(eq(users.id, userId));
};

export const updateUserResetToken = async (userId: string, token: string | null, expiresAt: Date | null) => {
    await db
        .update(users)
        .set({
            passwordResetToken: token,
            passwordResetExpiresAt: expiresAt,
            updatedAt: new Date()
        })
        .where(eq(users.id, userId));
};

export const updateLastLogin = async (userId: string) => {
  await db
    .update(users)
    .set({
      lastLoginAt: new Date(),
      loginCount: sql`COALESCE(${users.loginCount}, 0) + 1`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
};

// ─── Session queries ─────────────────────────────────────

export interface CreateSessionParams {
  userId: string;
  tokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

export const createSession = async (data: CreateSessionParams) => {
  const result = await db
    .insert(userSessions)
    .values({
      userId: data.userId,
      tokenHash: data.tokenHash,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      expiresAt: data.expiresAt,
    })
    .returning();

  return result[0];
};

export const findSessionByTokenHash = async (tokenHash: string) => {
  const result = await db
    .select()
    .from(userSessions)
    .where(and(eq(userSessions.tokenHash, tokenHash), isNull(userSessions.revokedAt)))
    .limit(1);

  return result[0] || null;
};

export const revokeSession = async (sessionId: string) => {
  await db
    .update(userSessions)
    .set({ revokedAt: new Date() })
    .where(eq(userSessions.id, sessionId));
};

export const revokeAllUserSessions = async (userId: string) => {
  await db
    .update(userSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(userSessions.userId, userId), isNull(userSessions.revokedAt)));
};
