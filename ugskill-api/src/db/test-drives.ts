import { db } from '../config/postgres';
import { companyDrives, driveRegistrations } from './pg/schema/placement';
import { users } from './pg/schema/core';

async function main() {
  try {
    const drives = await db.select().from(companyDrives);
    console.log('--- ALL COMPANY DRIVES IN POSTGRES ---');
    console.log(drives.map(d => ({ id: d.id, name: d.name, status: d.status, createdBy: d.createdBy })));

    const regs = await db.select().from(driveRegistrations);
    console.log('--- ALL DRIVE REGISTRATIONS IN POSTGRES ---');
    console.log(regs.map(r => ({ id: r.id, driveId: r.driveId, studentId: r.studentId, status: r.status })));
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

main();
