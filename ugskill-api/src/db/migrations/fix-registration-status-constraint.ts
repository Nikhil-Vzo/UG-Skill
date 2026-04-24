/**
 * Migration: Fix drive_registrations status CHECK constraint
 * Adds 'interview' and 'selected' to allowed status values.
 * Run once with: npx tsx src/db/migrations/fix-registration-status-constraint.ts
 */
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.PG_DATABASE_URL!);

async function migrate() {
  try {
    console.log('Checking existing constraint...');

    // Find the exact constraint definition
    const [constraint] = await sql`
      SELECT pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conname = 'drive_registrations_status_check'
        AND conrelid = 'drive_registrations'::regclass
    `;
    console.log('Current constraint:', constraint?.def ?? 'NOT FOUND');

    // Drop old constraint
    await sql`
      ALTER TABLE drive_registrations
      DROP CONSTRAINT IF EXISTS drive_registrations_status_check
    `;
    console.log('Dropped old constraint.');

    // Add new constraint with all valid statuses
    await sql`
      ALTER TABLE drive_registrations
      ADD CONSTRAINT drive_registrations_status_check
        CHECK (status IN ('registered', 'shortlisted', 'interview', 'rejected', 'selected'))
    `;
    console.log('Added new constraint with interview + selected.');

    // Verify
    const [newConstraint] = await sql`
      SELECT pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conname = 'drive_registrations_status_check'
        AND conrelid = 'drive_registrations'::regclass
    `;
    console.log('New constraint:', newConstraint?.def);

    console.log('\n✅ Migration complete!');
  } catch (err: any) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
