import dotenv from 'dotenv';
import path from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ugskill";

async function run() {
  const pgUrl = process.env.PG_DATABASE_URL;
  if (!pgUrl) {
    console.error('❌ PG_DATABASE_URL not set');
    process.exit(1);
  }
  const client = postgres(pgUrl, { ssl: 'require', max: 1 });
  const db = drizzle(client);

  try {
    // 1. Clean PostgreSQL placement tables in correct dependency order
    console.log('Cleaning PostgreSQL placement tables...');
    
    console.log('  - Cleaning live_interview_bookings...');
    await db.execute(sql`DELETE FROM live_interview_bookings`);
    
    console.log('  - Cleaning live_interview_slots...');
    await db.execute(sql`DELETE FROM live_interview_slots`);
    
    console.log('  - Cleaning gd_participants...');
    await db.execute(sql`DELETE FROM gd_participants`);
    
    console.log('  - Cleaning gd_sessions...');
    await db.execute(sql`DELETE FROM gd_sessions`);
    
    console.log('  - Cleaning placement_sessions...');
    await db.execute(sql`DELETE FROM placement_sessions`);
    
    console.log('  - Cleaning drive_registrations...');
    await db.execute(sql`DELETE FROM drive_registrations`);
    
    console.log('  - Cleaning company_drives...');
    await db.execute(sql`DELETE FROM company_drives`);
    
    console.log('  - Cleaning readiness_scores...');
    await db.execute(sql`DELETE FROM readiness_scores`);
    
    console.log('  - Cleaning companies...');
    await db.execute(sql`DELETE FROM companies`);
    
    console.log('✅ PostgreSQL Cleaned successfully!');

    // 2. Clean MongoDB placement collections
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB. Cleaning collections...');

    const dbMongo = mongoose.connection.db;
    if (dbMongo) {
      console.log('  - Cleaning companyprofiles...');
      await dbMongo.collection('companyprofiles').deleteMany({});
      
      console.log('  - Cleaning interviewflows...');
      await dbMongo.collection('interviewflows').deleteMany({});
      
      console.log('  - Cleaning mockinterviewattempts...');
      await dbMongo.collection('mockinterviewattempts').deleteMany({});
      
      console.log('  - Cleaning gdrecordings...');
      await dbMongo.collection('gdrecordings').deleteMany({});
      
      console.log('✅ MongoDB Cleaned successfully!');
    } else {
      console.warn('⚠️ MongoDB connection db object not found. Skipping Mongo cleanup.');
    }

  } catch (err: any) {
    console.error('❌ FAILED WITH ERROR:', err);
  } finally {
    await client.end();
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB.');
    } catch (e) {
      // Ignore disconnect error
    }
  }
}

run();
