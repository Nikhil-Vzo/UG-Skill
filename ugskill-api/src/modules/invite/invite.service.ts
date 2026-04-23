import crypto from 'crypto';
import { hashPassword } from '../../lib/password';
import { signAccessToken, signRefreshToken } from '../../lib/jwt';
import { AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import * as inviteRepo from './invite.repository';
import * as authRepo from '../auth/auth.repository';

// ── Generate an invite link (admin-only action) ────────────────────

export const generateInvite = async (
  adminId: string,
  email: string,
  role: 'hr' | 'creator' | 'admin',
  companyName?: string
) => {
  // Token: cryptographic 32-byte hex string
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

  const invite = await inviteRepo.createInvite({
    email,
    role,
    companyName,
    token,
    expiresAt,
    invitedBy: adminId,
  });

  logger.info('Invite generated', { inviteId: invite.id, email, role });

  const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/hr?token=${token}`;

  return {
    token,
    inviteUrl,
    expiresAt,
    invite,
  };
};

// ── Validate invite token (called before showing the accept form) ──

export const validateInviteToken = async (token: string) => {
  const invite = await inviteRepo.findInviteByToken(token);
  if (!invite) {
    throw new AppError('Invite link is invalid or has expired', 400);
  }
  return {
    email: invite.email,
    role: invite.role,
    companyName: invite.companyName,
    expiresAt: invite.expiresAt,
  };
};

// ── Accept the invite: create account + return tokens ─────────────

export const acceptInvite = async (
  token: string,
  fullName: string,
  password: string,
  ip?: string,
  userAgent?: string
) => {
  // 1. Validate token
  const invite = await inviteRepo.findInviteByToken(token);
  if (!invite) {
    throw new AppError('Invite link is invalid or has expired', 400);
  }

  // 2. Check user doesn't already exist
  const existing = await authRepo.findUserByEmail(invite.email);
  if (existing) {
    throw new AppError('An account with this email already exists. Please log in.', 409);
  }

  // 3. Hash password
  const passwordHash = await hashPassword(password);

  // 4. Create user with invited role
  const { db } = await import('../../config/postgres');
  const { users } = await import('../../db/pg/schema/core');
  const { sql } = await import('drizzle-orm');

  const userResult = await db
    .insert(users)
    .values({
      email: invite.email,
      passwordHash,
      fullName,
      roles: sql`ARRAY[${invite.role}]::TEXT[]`,
    })
    .returning();

  const user = userResult[0];

  // 5. Mark invite as accepted
  await inviteRepo.markInviteAccepted(invite.id);

  // 6. Issue tokens
  const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    roles: user.roles as string[],
  });
  const refreshToken = signRefreshToken({ userId: user.id });

  const tokenHash = hashToken(refreshToken);
  const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await authRepo.createSession({
    userId: user.id,
    tokenHash,
    ipAddress: ip,
    userAgent,
    expiresAt: sessionExpiresAt,
  });

  logger.info('Invite accepted, account created', { userId: user.id, role: invite.role });

  const { passwordHash: _ph, deletedAt: _da, ...safeUser } = user;

  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
};
