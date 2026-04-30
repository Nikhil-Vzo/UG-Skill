import crypto from 'crypto';
import * as authRepo from './auth.repository';
import { hashPassword, comparePassword } from '../../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken, JwtPayload } from '../../lib/jwt';
import { AppError, AuthError } from '../../lib/errors';
import { logAction } from '../audit/audit.service';
import { logger } from '../../lib/logger';
import type { RegisterInput, LoginInput } from './auth.schemas';
import { events, APP_EVENTS } from '../../lib/events';

// Helper: hash a refresh token for storage (so it's not stored in plain text)
const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// ─── Register ────────────────────────────────────────────

export const register = async (data: RegisterInput, ip?: string) => {
  // 1. Check if user exists
  const existing = await authRepo.findUserByEmail(data.email);
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  // 2. Hash password
  const passwordHash = await hashPassword(data.password);

  // 3. Create user
  const user = await authRepo.createUser({
    email: data.email,
    passwordHash,
    fullName: data.fullName,
    phone: data.phone,
    institution: data.institution,
    branch: data.branch,
    graduationYear: data.graduationYear,
  });

  // 4. Sign tokens
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    roles: user.roles as string[],
  });

  const refreshToken = signRefreshToken({ userId: user.id });

  // 5. Store session
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await authRepo.createSession({
    userId: user.id,
    tokenHash,
    ipAddress: ip,
    expiresAt,
  });

  // 6. Audit log
  await logAction({
    actorId: user.id,
    action: 'USER_REGISTERED',
    entityType: 'user',
    entityId: user.id,
    ipAddress: ip,
  });

  // 7. Emit for CDC
  events.emit(APP_EVENTS.USER_REGISTERED, {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles,
    institution: user.institution,
    branch: user.branch,
    graduationYear: user.graduationYear,
    createdAt: user.createdAt,
  });

  logger.info('User registered', { userId: user.id, email: user.email });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

// ─── Login ───────────────────────────────────────────────

export const login = async (data: LoginInput, ip?: string, userAgent?: string) => {
  // 1. Find user
  const user = await authRepo.findUserByEmail(data.email);
  if (!user) {
    throw new AuthError('Invalid email or password');
  }

  // 2. Check status
  if (user.status !== 'active') {
    throw new AuthError(`Account is ${user.status}. ${user.suspensionReason || ''}`, 403);
  }

  // 3. Verify password
  if (!user.passwordHash) {
    throw new AuthError('Please use OAuth to log in');
  }

  const valid = await comparePassword(data.password, user.passwordHash);
  if (!valid) {
    throw new AuthError('Invalid email or password');
  }

  // 4. Sign tokens
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    roles: user.roles as string[],
  });

  const refreshToken = signRefreshToken({ userId: user.id });

  // 5. Store session
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await authRepo.createSession({
    userId: user.id,
    tokenHash,
    ipAddress: ip,
    userAgent,
    expiresAt,
  });

  // 6. Update last login
  await authRepo.updateLastLogin(user.id);

  logger.info('User logged in', { userId: user.id, email: user.email });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

// ─── Logout ──────────────────────────────────────────────

export const logout = async (refreshToken: string) => {
  const tokenHash = hashToken(refreshToken);
  const session = await authRepo.findSessionByTokenHash(tokenHash);

  if (session) {
    await authRepo.revokeSession(session.id);
    logger.info('User logged out', { sessionId: session.id });
  }
};

// ─── Refresh Tokens ──────────────────────────────────────

export const refreshTokens = async (oldRefreshToken: string, ip?: string, userAgent?: string) => {
  // 1. Verify the old refresh token
  let decoded: { userId: string };
  try {
    decoded = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new AuthError('Invalid or expired refresh token');
  }

  // 2. Check session exists and not revoked
  const oldHash = hashToken(oldRefreshToken);
  const session = await authRepo.findSessionByTokenHash(oldHash);
  if (!session) {
    // Possible token reuse attack — revoke all sessions for safety
    logger.warn('Refresh token reuse detected', { userId: decoded.userId });
    await authRepo.revokeAllUserSessions(decoded.userId);
    throw new AuthError('Session not found. All sessions revoked for security.');
  }

  // 3. Revoke old session
  await authRepo.revokeSession(session.id);

  // 4. Look up user
  const user = await authRepo.findUserById(decoded.userId);
  if (!user || user.status !== 'active') {
    throw new AuthError('User not found or account inactive');
  }

  // 5. Issue new token pair
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    roles: user.roles as string[],
  });

  const newRefreshToken = signRefreshToken({ userId: user.id });

  // 6. Store new session
  const newHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await authRepo.createSession({
    userId: user.id,
    tokenHash: newHash,
    ipAddress: ip,
    userAgent,
    expiresAt,
  });

  return { accessToken, refreshToken: newRefreshToken };
};

// ─── Forgot Password ────────────────────────────────────

export const forgotPassword = async (email: string) => {
  const user = await authRepo.findUserByEmail(email);
  if (!user) {
    // Return 200 even if user not found for security reasons
    return;
  }

  // Generate random 32-byte hex token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiry

  await authRepo.updateUserResetToken(user.id, token, expiresAt);

  // Placeholder: Log to console as we don't have an email service
  logger.info(`[AUTH] Password reset requested for ${email}. Token: ${token}`);
  console.log(`\n--- PASSWORD RESET LINK (DEV) ---`);
  console.log(`Token: ${token}`);
  console.log(`URL: http://localhost:4000/api/v1/auth/reset-password?token=${token}`);
  console.log(`---------------------------------\n`);
};

// ─── Reset Password ─────────────────────────────────────

export const resetPassword = async (token: string, newPassword: string) => {
  // 1. Find user by token
  const user = await authRepo.findUserByResetToken(token);
  
  if (!user || !user.passwordResetExpiresAt) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // 2. Check expiry
  if (new Date() > user.passwordResetExpiresAt) {
    // Clear expired token
    await authRepo.updateUserResetToken(user.id, null, null);
    throw new AppError('Reset token has expired', 400);
  }

  // 3. Hash new password
  const passwordHash = await hashPassword(newPassword);
  
  // 4. Update password and clear token fields
  await authRepo.updateUserPassword(user.id, passwordHash);

  // 5. Audit log
  await logAction({
    actorId: user.id,
    action: 'PASSWORD_RESET',
    entityType: 'user',
    entityId: user.id,
  });

  logger.info('Password reset successful', { userId: user.id });
};

// ─── Helpers ─────────────────────────────────────────────

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await authRepo.findUserById(userId);
  if (!user || !user.passwordHash) {
    throw new AuthError('Unable to change password for this account', 400);
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AuthError('Current password is incorrect', 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await authRepo.updateUserPassword(user.id, passwordHash);

  await logAction({
    actorId: user.id,
    action: 'PASSWORD_CHANGED',
    entityType: 'user',
    entityId: user.id,
  });

  logger.info('Password changed successfully', { userId: user.id });
};

const sanitizeUser = (user: any) => {
  const { passwordHash, deletedAt, ...safe } = user;
  return safe;
};
