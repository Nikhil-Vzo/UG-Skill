import dotenv from 'dotenv';
import path from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function run() {
  const pgUrl = process.env.PG_DATABASE_URL;
  if (!pgUrl) {
    console.error('❌ PG_DATABASE_URL not set');
    process.exit(1);
  }
  const client = postgres(pgUrl, { ssl: 'require', max: 1 });
  const db = drizzle(client);

  try {
    console.log('Cleaning placement_sessions table...');
    await db.execute(sql`DELETE FROM placement_sessions`);
    console.log('Cleaning drive_registrations table...');
    await db.execute(sql`DELETE FROM drive_registrations`);
    console.log('✅ DB Cleaned successfully!');
  } catch (err: any) {
    console.error('FAILED WITH ERROR:', err);
  } finally {
    await client.end();
  }
}

run();
