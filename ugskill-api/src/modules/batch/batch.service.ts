import * as batchRepo from './batch.repository';
import { NotFoundError } from '../../lib/errors';
import { logAction } from '../audit/audit.service';
import type { CreateBatchInput, UpdateBatchInput, AddMembersInput } from './batch.schemas';

export const createBatch = async (data: CreateBatchInput, createdBy: string, ip?: string) => {
  const batch = await batchRepo.createBatch({ ...data, createdBy });

  await logAction({
    actorId: createdBy,
    action: 'BATCH_CREATED',
    entityType: 'batch',
    entityId: batch.id,
    newValue: data,
    ipAddress: ip,
  });

  return batch;
};

export const getBatch = async (id: string) => {
  const batch = await batchRepo.findBatchById(id);
  if (!batch) throw new NotFoundError('Batch not found');

  const members = await batchRepo.findBatchMembers(id);
  return { ...batch, members };
};

export const listBatches = async (page: number, perPage: number) => {
  return batchRepo.findAllBatches(page, perPage);
};

export const updateBatch = async (id: string, data: UpdateBatchInput, actorId: string, ip?: string) => {
  const existing = await batchRepo.findBatchById(id);
  if (!existing) throw new NotFoundError('Batch not found');

  const updated = await batchRepo.updateBatch(id, data);

  await logAction({
    actorId,
    action: 'BATCH_UPDATED',
    entityType: 'batch',
    entityId: id,
    oldValue: existing,
    newValue: data,
    ipAddress: ip,
  });

  return updated;
};

export const deleteBatch = async (id: string, actorId: string, ip?: string) => {
  const batch = await batchRepo.softDeleteBatch(id);
  if (!batch) throw new NotFoundError('Batch not found');

  await logAction({
    actorId,
    action: 'BATCH_DELETED',
    entityType: 'batch',
    entityId: id,
    ipAddress: ip,
  });

  return { message: 'Batch deleted successfully' };
};

export const addMembers = async (batchId: string, data: AddMembersInput, actorId: string, ip?: string) => {
  const batch = await batchRepo.findBatchById(batchId);
  if (!batch) throw new NotFoundError('Batch not found');

  const members = await batchRepo.addMembers(batchId, data.userIds, data.role);

  await logAction({
    actorId,
    action: 'BATCH_MEMBERS_ADDED',
    entityType: 'batch',
    entityId: batchId,
    newValue: { userIds: data.userIds, role: data.role },
    ipAddress: ip,
  });

  return members;
};

export const removeMember = async (batchId: string, userId: string, actorId: string, ip?: string) => {
  const result = await batchRepo.removeMember(batchId, userId);
  if (!result) throw new NotFoundError('Member not found in batch');

  await logAction({
    actorId,
    action: 'BATCH_MEMBER_REMOVED',
    entityType: 'batch',
    entityId: batchId,
    newValue: { userId },
    ipAddress: ip,
  });

  return { message: 'Member removed successfully' };
};
