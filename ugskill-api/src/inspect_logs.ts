import { db } from './config/postgres';
import { auditLogs } from './db/pg/schema/core';
import { companyDrives, driveRegistrations } from './db/pg/schema/placement';
import { desc } from 'drizzle-orm';

async function run() {
  try {
    const logs = await db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);
    console.log('Action Logs:');
    console.dir(logs, { depth: null });

    const registrations = await db
      .select()
      .from(driveRegistrations);
    console.log('Registrations:');
    console.dir(registrations, { depth: null });

    const drives = await db
      .select()
      .from(companyDrives);
    console.log('Drives:');
    console.dir(drives.map(d => ({ id: d.id, name: d.name, createdBy: d.createdBy, status: d.status })), { depth: null });

  } catch (error) {
    console.error('Error running inspect:', error);
  } finally {
    process.exit(0);
  }
}

run();
