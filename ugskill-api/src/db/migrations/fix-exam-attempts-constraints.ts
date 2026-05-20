import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.PG_DATABASE_URL!);

async function migrate() {
  try {
    console.log('Checking existing constraints on exam_attempts...');

    // Drop old status constraint if exists
    await sql`
      ALTER TABLE exam_attempts
      DROP CONSTRAINT IF EXISTS exam_attempts_status_check
    `;
    console.log('Dropped status constraint.');

    // Add updated status constraint
    await sql`
      ALTER TABLE exam_attempts
      ADD CONSTRAINT exam_attempts_status_check
        CHECK (status IN ('in_progress', 'submitted', 'auto_submitted', 'disqualified', 'abandoned', 'terminated'))
    `;
    console.log('Added updated status constraint.');

    // Drop old proctoring verdict constraint if exists
    await sql`
      ALTER TABLE exam_attempts
      DROP CONSTRAINT IF EXISTS exam_attempts_proctoring_verdict_check
    `;
    console.log('Dropped proctoring verdict constraint.');

    // Add updated proctoring verdict constraint
    await sql`
      ALTER TABLE exam_attempts
      ADD CONSTRAINT exam_attempts_proctoring_verdict_check
        CHECK (proctoring_verdict IN ('pending', 'clean', 'flagged', 'disqualified', 'flagged_critical', 'admin_terminated'))
    `;
    console.log('Added updated proctoring verdict constraint.');

    console.log('\n✅ Exam attempts constraints migration complete!');
  } catch (err: any) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
