import { db } from '../src/config/postgres';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Fixing foreign key constraints for cascade delete...');
  
  try {
    // 1. exam_attempts
    console.log('Updating exam_attempts...');
    await db.execute(sql`ALTER TABLE exam_attempts DROP CONSTRAINT IF EXISTS exam_attempts_exam_id_exams_id_fk`);
    await db.execute(sql`ALTER TABLE exam_attempts ADD CONSTRAINT exam_attempts_exam_id_exams_id_fk FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE`);

    // 2. exam_batch_access
    console.log('Updating exam_batch_access...');
    await db.execute(sql`ALTER TABLE exam_batch_access DROP CONSTRAINT IF EXISTS exam_batch_access_exam_id_exams_id_fk`);
    await db.execute(sql`ALTER TABLE exam_batch_access ADD CONSTRAINT exam_batch_access_exam_id_exams_id_fk FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE`);

    // 3. exam_rankings
    console.log('Updating exam_rankings...');
    await db.execute(sql`ALTER TABLE exam_rankings DROP CONSTRAINT IF EXISTS exam_rankings_exam_id_exams_id_fk`);
    await db.execute(sql`ALTER TABLE exam_rankings ADD CONSTRAINT exam_rankings_exam_id_exams_id_fk FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE`);

    // 4. exam_scores (depends on attempts)
    console.log('Updating exam_scores...');
    await db.execute(sql`ALTER TABLE exam_scores DROP CONSTRAINT IF EXISTS exam_scores_attempt_id_exam_attempts_id_fk`);
    await db.execute(sql`ALTER TABLE exam_scores ADD CONSTRAINT exam_scores_attempt_id_exam_attempts_id_fk FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE`);

    console.log('✅ Constraints updated successfully!');
  } catch (err) {
    console.error('❌ Failed to update constraints:', err);
  } finally {
    process.exit(0);
  }
}

main();
