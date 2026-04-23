import * as auditRepository from './audit.repository';

export const logAction = async (params: auditRepository.CreateAuditLogParams) => {
  // Can add any queueing logic here later if needed
  await auditRepository.createAuditLog(params);
};
