import * as userRepo from './user.repository';
import { NotFoundError, AppError } from '../../lib/errors';
import { logAction } from '../audit/audit.service';
import { events, APP_EVENTS } from '../../lib/events';
import type { UpdateMeInput } from './user.schemas';

const sanitizeUser = (user: any) => {
  const { passwordHash, deletedAt, ...safe } = user;
  return safe;
};

export const getMe = async (userId: string) => {
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  return sanitizeUser(user);
};

export const updateMe = async (userId: string, data: UpdateMeInput, ip?: string) => {
  const user = await userRepo.updateUser(userId, data);
  if (!user) throw new NotFoundError('User not found');

  await logAction({
    actorId: userId,
    action: 'USER_PROFILE_UPDATED',
    entityType: 'user',
    entityId: userId,
    newValue: data,
    ipAddress: ip,
  });

  // CDC: sync updated profile to Mongo user_snapshots
  events.emit(APP_EVENTS.USER_UPDATED, {
    userId,
    fullName: user.fullName,
    institution: user.institution,
    branch: user.branch,
    cgpa: user.cgpa ? Number(user.cgpa) : undefined,
    graduationYear: user.graduationYear,
    roles: user.roles,
  });

  return sanitizeUser(user);
};

export const listUsers = async (
  filters: userRepo.ListUsersFilters,
  page: number,
  perPage: number
) => {
  const { data, total } = await userRepo.findAll(filters, page, perPage);
  return {
    users: data.map(sanitizeUser),
    total,
  };
};

export const getUser = async (id: string) => {
  const user = await userRepo.findById(id);
  if (!user) throw new NotFoundError('User not found');

  return sanitizeUser(user);
};

export const deleteUser = async (id: string, actorId: string, ip?: string) => {
  const user = await userRepo.softDeleteUser(id);
  if (!user) throw new NotFoundError('User not found');

  await logAction({
    actorId,
    action: 'USER_DELETED',
    entityType: 'user',
    entityId: id,
    ipAddress: ip,
  });

  return { message: 'User deleted successfully' };
};
