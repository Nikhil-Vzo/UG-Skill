import { eq, and, isNull, gt } from 'drizzle-orm';
import { db } from '../../config/postgres';
import { userInvites } from '../../db/pg/schema/core';

export const createInvite = async (data: {
  email: string;
  role: string;
  companyName?: string;
  token: string;
  expiresAt: Date;
  invitedBy: string;
}) => {
  const result = await db
    .insert(userInvites)
    .values({
      email: data.email,
      role: data.role,
      companyName: data.companyName || null,
      token: data.token,
      expiresAt: data.expiresAt,
      invitedBy: data.invitedBy,
    })
    .returning();
  return result[0];
};

export const findInviteByToken = async (token: string) => {
  const result = await db
    .select()
    .from(userInvites)
    .where(
      and(
        eq(userInvites.token, token),
        isNull(userInvites.acceptedAt),
        gt(userInvites.expiresAt, new Date())
      )
    )
    .limit(1);
  return result[0] || null;
};

export const markInviteAccepted = async (id: string) => {
  await db
    .update(userInvites)
    .set({ acceptedAt: new Date() })
    .where(eq(userInvites.id, id));
};

export const findAllInvites = async () => {
  return db
    .select()
    .from(userInvites)
    .orderBy(userInvites.createdAt);
};
