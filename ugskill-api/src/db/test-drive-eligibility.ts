import { db } from '../config/postgres';
import { companyDrives } from './pg/schema/placement';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    const drive = await db.select().from(companyDrives).where(eq(companyDrives.id, '425d2e76-f500-44d0-8222-c1afe8b03ae9'));
    console.log('--- DRIVE DETAILS ---');
    console.log(JSON.stringify(drive, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

main();
