
import { db } from '../src/config/postgres';
import { sql } from 'drizzle-orm';

async function check() {
  try {
    const res = await db.execute(sql`SELECT count(*) FROM course_catalog`);
    console.log('Postgres Course Count:', res);
    const all = await db.execute(sql`SELECT * FROM course_catalog LIMIT 10`);
    console.log('First 10 Courses:', JSON.stringify(all, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
