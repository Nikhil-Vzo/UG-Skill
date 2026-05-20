import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './pg/schema';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ugskill";

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, required: true },
  pg_creator_id: { type: String, required: true },
  category: { type: String },
  sub_category: { type: String },
  difficulty: { type: String },
  is_free: { type: Boolean },
  price: { type: Number },
  tags: [String],
  sections: [mongoose.Schema.Types.Mixed],
}, { timestamps: true });

const CourseModel = mongoose.models.Course || mongoose.model('Course', CourseSchema);

async function sync() {
  const pgUrl = process.env.PG_DATABASE_URL;
  if (!pgUrl) {
    console.error('❌ PG_DATABASE_URL is not set');
    process.exit(1);
  }

  const pgUrlObj = new URL(pgUrl);
  const client = postgres({
    host: pgUrlObj.hostname,
    port: Number(pgUrlObj.port) || 5432,
    database: pgUrlObj.pathname.slice(1),
    username: decodeURIComponent(pgUrlObj.username),
    password: decodeURIComponent(pgUrlObj.password),
    ssl: 'require',
    max: 1,
  });
  const db = drizzle(client, { schema });

  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const courses = await CourseModel.find({}).lean();
    console.log(`Found ${courses.length} courses in MongoDB. Syncing to PostgreSQL course_catalog...`);

    for (const course of courses) {
      const lectureCount = (course as any).sections?.reduce((sum: number, s: any) => sum + (s.lectures?.length || 0), 0) || 0;
      const totalDurationSecs = (course as any).sections?.reduce((sum: number, s: any) => sum + (s.lectures?.reduce((lSum: number, l: any) => lSum + (l.duration_secs || 0), 0) || 0), 0) || 0;

      await db.insert(schema.courseCatalog).values({
        id: course._id.toString(),
        title: (course as any).title,
        status: (course as any).status,
        creatorId: (course as any).pg_creator_id,
        category: (course as any).category,
        subCategory: (course as any).sub_category,
        difficulty: (course as any).difficulty,
        isFree: (course as any).is_free,
        price: String((course as any).price || 0),
        lectureCount,
        totalDurationSecs,
        tags: (course as any).tags,
      }).onConflictDoUpdate({
        target: schema.courseCatalog.id,
        set: {
          title: (course as any).title,
          status: (course as any).status,
          creatorId: (course as any).pg_creator_id,
          category: (course as any).category,
          subCategory: (course as any).sub_category,
          difficulty: (course as any).difficulty,
          isFree: (course as any).is_free,
          price: String((course as any).price || 0),
          lectureCount,
          totalDurationSecs,
          tags: (course as any).tags,
          updatedAt: new Date(),
        }
      });
      console.log(`Synced: "${(course as any).title}" (${course._id.toString()})`);
    }

    console.log('🎉 Catalog sync successfully completed!');
    await mongoose.disconnect();
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync error:', error);
    await client.end();
    process.exit(1);
  }
}

sync();
