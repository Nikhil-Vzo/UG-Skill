import { db } from './config/postgres';
import { studentStreaks } from './db/pg/schema/lms';
import { users } from './db/pg/schema/core';
import { progressService } from './modules/progress/progress.service';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('--- BEFORE TEST ---');
  const initialStreaks = await db.select().from(studentStreaks);
  console.dir(initialStreaks, { depth: null });

  const adminId = '1d216604-5eeb-422a-8e70-fe4db3051fcf';
  const studentId = '6c0dbd4c-2108-4e32-a051-e764722aa88a';

  console.log('\n--- TESTING getStudentStreak for Admin ---');
  const adminRes = await progressService.getStudentStreak(adminId);
  console.log('Result:', adminRes);

  console.log('\n--- TESTING getStudentStreak for Student ---');
  const studentRes = await progressService.getStudentStreak(studentId);
  console.log('Result:', studentRes);

  console.log('\n--- AFTER TEST ---');
  const finalStreaks = await db.select().from(studentStreaks);
  console.dir(finalStreaks, { depth: null });

  process.exit(0);
}

main();
