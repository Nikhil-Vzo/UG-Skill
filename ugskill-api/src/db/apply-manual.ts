import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function applyMigration() {
  const pgUrl = process.env.PG_DATABASE_URL;
  if (!pgUrl) {
    console.error('❌ PG_DATABASE_URL not set');
    process.exit(1);
  }

  const client = postgres(pgUrl, { ssl: 'require', max: 1 });
  
  const migrationPath = path.resolve(process.cwd(), 'src/db/pg/migrations/0002_steep_talos.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('🚀 Applying migration manually...');
  try {
    // Split by --> statement-breakpoint
    const statements = sql.split('--> statement-breakpoint');
    for (const stmt of statements) {
      if (stmt.trim()) {
        console.log(`Executing: ${stmt.trim()}`);
        await client.unsafe(stmt.trim());
      }
    }
    console.log('✅ Migration applied successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

applyMigration();
