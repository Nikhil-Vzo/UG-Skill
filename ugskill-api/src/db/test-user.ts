import { db } from '../config/postgres';
import { users } from './pg/schema/core';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    const student = await db.select().from(users).where(eq(users.email, 'student@ugskill.com'));
    console.log('--- STUDENT USER IN POSTGRES ---');
    console.log(student);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

main();
