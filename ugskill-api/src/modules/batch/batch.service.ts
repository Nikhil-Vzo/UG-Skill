import * as batchRepo from './batch.repository';
import { NotFoundError } from '../../lib/errors';
import { logAction } from '../audit/audit.service';
import type { CreateBatchInput, UpdateBatchInput, AddMembersInput } from './batch.schemas';
import { enrollmentRepo } from '../enrollment/enrollment.repository';

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

  const [members, courses] = await Promise.all([
    batchRepo.findBatchMembers(id),
    batchRepo.findBatchCourseAccess(id),
  ]);
  return { ...batch, members, courses };
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

  // Auto-enroll added student members into all courses the batch has access to
  if (data.role === 'student') {
    try {
      const coursesAccess = await batchRepo.findBatchCourseAccess(batchId);
      for (const userAccess of coursesAccess) {
        if (userAccess.courseId) {
          for (const userId of data.userIds) {
            const existing = await enrollmentRepo.getEnrollment(userId, 'course', userAccess.courseId);
            if (!existing) {
              await enrollmentRepo.enrollStudent({
                studentId: userId,
                enrollableType: 'course',
                enrollableId: userAccess.courseId,
                source: 'batch',
                batchId,
              });
            }
          }
        }
      }
    } catch (err) {
      // Log error but don't fail the add members action
      console.error('Failed to auto-enroll batch members:', err);
    }
  }

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

export const grantCourseAccess = async (batchId: string, courseId: string, actorId: string, ip?: string) => {
  const batch = await batchRepo.findBatchById(batchId);
  if (!batch) throw new NotFoundError('Batch not found');

  const access = await batchRepo.grantCourseAccess(batchId, courseId, actorId);

  // Auto-enroll all active student members of the batch in this course
  try {
    const members = await batchRepo.findBatchMembers(batchId);
    for (const member of members) {
      if (member.userId) {
        const existing = await enrollmentRepo.getEnrollment(member.userId, 'course', courseId);
        if (!existing) {
          await enrollmentRepo.enrollStudent({
            studentId: member.userId,
            enrollableType: 'course',
            enrollableId: courseId,
            source: 'batch',
            batchId,
          });
        }
      }
    }
  } catch (err) {
    // Log error but don't fail course access grant
    console.error('Failed to auto-enroll batch members upon granting access:', err);
  }

  await logAction({
    actorId,
    action: 'BATCH_COURSE_ACCESS_GRANTED',
    entityType: 'batch',
    entityId: batchId,
    newValue: { courseId },
    ipAddress: ip,
  });

  return access;
};

export const revokeCourseAccess = async (batchId: string, courseId: string, actorId: string, ip?: string) => {
  const result = await batchRepo.revokeCourseAccess(batchId, courseId);
  if (!result) throw new NotFoundError('Course access not found for this batch');

  await logAction({
    actorId,
    action: 'BATCH_COURSE_ACCESS_REVOKED',
    entityType: 'batch',
    entityId: batchId,
    newValue: { courseId },
    ipAddress: ip,
  });

  return { message: 'Course access revoked successfully' };
};
