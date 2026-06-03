import { db } from '../config/postgres';
import { users } from './pg/schema/core';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    const res = await db.update(users)
      .set({ cgpa: '8.5' as any }) // cgpa is numeric/decimal in postgres, we can use string or number depending on schema
      .where(eq(users.email, 'student@ugskill.com'))
      .returning();
    
    console.log('✅ Student CGPA updated:');
    console.log(res);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

main();
