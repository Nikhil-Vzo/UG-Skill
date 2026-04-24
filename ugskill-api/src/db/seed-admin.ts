/**
 * seed-admin.ts
 * One-time script to seed a super admin user into the database.
 * Run with: npm run seed:admin
 */
import dotenv from 'dotenv';
import path from 'path';

// Load env BEFORE any other imports that depend on it
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from './pg/schema';

const ADMIN_EMAIL = 'admin@ugskill.com';
const ADMIN_PASSWORD = 'Admin@123';
const ADMIN_NAME = 'Super Admin';
const BCRYPT_ROUNDS = 12;

export async function seedAdmin() {
  const pgUrl = process.env.PG_DATABASE_URL;
  if (!pgUrl) {
    console.error('❌ PG_DATABASE_URL is not set in .env');
    throw new Error('PG_DATABASE_URL is not set in .env');
  }

  // Use explicit options to avoid postgres.js misparse of dot-notation username
  const url = new URL(pgUrl);
  const client = postgres({
    host: url.hostname,
    port: Number(url.port) || 5432,
    database: url.pathname.slice(1),
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: 'require',
    max: 1,
  });
  const db = drizzle(client, { schema });

  console.log('🔗 Connected to database.');
  console.log(`🔍 Checking if admin user (${ADMIN_EMAIL}) already exists...`);

  try {
    const existing = await db
      .select({ id: schema.users.id, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.email, ADMIN_EMAIL))
      .limit(1);

    if (existing.length > 0) {
      console.log(`✅ Admin user already exists (id: ${existing[0].id}). Nothing to do.`);
      await client.end();
      return;
    }

    console.log('👤 Admin user not found. Creating...');

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

    const [inserted] = await db
      .insert(schema.users)
      .values({
        email: ADMIN_EMAIL,
        passwordHash,
        fullName: ADMIN_NAME,
        roles: ['super_admin', 'admin'],
        emailVerified: true,
        status: 'active',
      })
      .returning({ id: schema.users.id, email: schema.users.email });

    console.log('');
    console.log('🎉 Super Admin seeded successfully!');
    console.log('────────────────────────────────');
    console.log(`  ID    : ${inserted.id}`);
    console.log(`  Email : ${inserted.email}`);
    console.log(`  Pass  : ${ADMIN_PASSWORD}`);
    console.log('────────────────────────────────');
    console.log('⚠️  Please change your password after first login!');
    console.log('');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await client.end();
    throw error;
  }

  await client.end();
}

// Support running directly via `npm run seed:admin`
if (process.argv[1] && process.argv[1].includes('seed-admin')) {
  seedAdmin()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
