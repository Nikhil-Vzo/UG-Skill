import { db } from '../../config/postgres';
import { auditLogs } from '../../db/pg/schema/core';

export interface CreateAuditLogParams {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
}

export const createAuditLog = async (params: CreateAuditLogParams) => {
  try {
    await db.insert(auditLogs).values({
      actorId: params.actorId || null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValue: params.oldValue ? params.oldValue : null,
      newValue: params.newValue ? params.newValue : null,
      ipAddress: params.ipAddress || null,
    });
  } catch (error) {
    // We usually don't want an audit log failure to break the main transaction,
    // so we might just log it to our application logger.
    console.error('Failed to write audit log:', error);
  }
};
