import dotenv from 'dotenv';
import path from 'path';

// Load env BEFORE any other imports that depend on it
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, inArray } from 'drizzle-orm';
import * as schema from './pg/schema';

const BCRYPT_ROUNDS = 12;

const DEV_USERS = [
  {
    email: 'admin@ugskill.com',
    password: 'Admin@123',
    fullName: 'Super Admin',
    roles: ['super_admin', 'admin']
  },
  {
    email: 'hr@ugskill.com',
    password: 'Hr@123',
    fullName: 'Test HR Manager',
    roles: ['hr']
  },
  {
    email: 'student@ugskill.com',
    password: 'Student@123',
    fullName: 'Test Student',
    roles: ['student']
  }
];

async function seedDevUsers() {
  const pgUrl = process.env.PG_DATABASE_URL;
  if (!pgUrl) {
    console.error('❌ PG_DATABASE_URL is not set in .env');
    process.exit(1);
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
  console.log('🌱 Seeding development test accounts...');

  try {
    for (const userData of DEV_USERS) {
      const existing = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.email, userData.email))
        .limit(1);

      if (existing.length > 0) {
        console.log(`✅ User ${userData.email} already exists. Skipping.`);
        continue;
      }

      const passwordHash = await bcrypt.hash(userData.password, BCRYPT_ROUNDS);

      await db.insert(schema.users).values({
        email: userData.email,
        passwordHash,
        fullName: userData.fullName,
        roles: userData.roles,
        emailVerified: true,
        status: 'active',
      });

      console.log(`👤 Created user: ${userData.email} (${userData.roles.join(', ')})`);
    }

    console.log('');
    console.log('🎉 Development test accounts successfully seeded!');
    console.log('────────────────────────────────');
    for (const u of DEV_USERS) {
      console.log(`Role  : ${u.roles[0].toUpperCase()}`);
      console.log(`Email : ${u.email}`);
      console.log(`Pass  : ${u.password}`);
      console.log('────────────────────────────────');
    }
    console.log('');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await client.end();
    process.exit(1);
  }

  await client.end();
  process.exit(0);
}

seedDevUsers();
