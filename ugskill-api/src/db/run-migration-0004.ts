/**
 * run-migration-0004.ts
 * Applies migration 0004: adds round_label, scheduled_at, feedback_notes to placement_sessions
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import postgres from 'postgres';

async function run() {
  const connectionString = process.env.PG_DATABASE_URL;
  if (!connectionString) {
    console.error('❌ PG_DATABASE_URL is not defined in environment variables');
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });

  try {
    console.log('🔗 Connecting to PostgreSQL…');
    await sql`SELECT 1`;
    console.log('✅ Connected');

    console.log('🔨 Running migration…');
    await sql`ALTER TABLE placement_sessions ADD COLUMN IF NOT EXISTS round_label text;`;
    await sql`ALTER TABLE placement_sessions ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone;`;
    await sql`ALTER TABLE placement_sessions ADD COLUMN IF NOT EXISTS feedback_notes text;`;
    console.log('✅ Migration complete! Columns added to placement_sessions.');

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
