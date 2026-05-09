
import { db } from '../src/config/postgres';
import { exams } from '../src/db/pg/schema';
import { count } from 'drizzle-orm';

async function check() {
  try {
    const res = await db.select({ value: count() }).from(exams);
    console.log('Postgres Exam Count:', res[0].value);
    const all = await db.select().from(exams).limit(10);
    console.log('First 10 Exams:', JSON.stringify(all, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
