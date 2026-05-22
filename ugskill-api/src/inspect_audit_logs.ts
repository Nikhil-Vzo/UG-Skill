import { db } from './config/postgres';
import { auditLogs } from './db/pg/schema/core';
import { eq } from 'drizzle-orm';

async function run() {
  try {
    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, 'PLACEMENT_DRIVE_DELETED'));
    console.dir(logs, { depth: null });
  } catch (error) {
    console.error('Error running inspect:', error);
  } finally {
    process.exit(0);
  }
}

run();
