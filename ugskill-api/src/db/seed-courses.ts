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
  status: { type: String, enum: ['draft', 'review', 'published', 'archived'], required: true },
  pg_creator_id: { type: String, required: true },
  schema_version: { type: Number, required: true, default: 1 },
  category: { type: String },
  sub_category: { type: String },
  difficulty: { type: String },
  language: { type: String, default: 'english' },
  thumbnail_url: { type: String },
  is_free: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  tags: [String],
  sections: [mongoose.Schema.Types.Mixed],
  avg_rating: { type: Number },
  total_ratings: { type: Number, default: 0 },
  enrollment_count: { type: Number, default: 0 },
  lecture_count: { type: Number, default: 0 },
  total_duration_secs: { type: Number, default: 0 },
  version: { type: Number, default: 1 },
}, { timestamps: true });

const CourseModel = mongoose.models.Course || mongoose.model('Course', CourseSchema);

const SAMPLE_COURSES = [
  {
    _id: new mongoose.Types.ObjectId('6a01fe8b0cef37dbaf97a899'),
    title: 'Full Stack Web Development with React & Node.js',
    status: 'published',
    category: 'Engineering',
    sub_category: 'Web Development',
    difficulty: 'intermediate',
    is_free: false,
    price: 49.99,
    thumbnail_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
    tags: ['react', 'node', 'javascript', 'web'],
    sections: [
      {
        title: 'Introduction to Modern Web',
        lectures: [
          { title: 'The Evolution of the Web', type: 'video', duration_secs: 600 },
          { title: 'Setting up your Dev Environment', type: 'video', duration_secs: 900 }
        ]
      }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId('6a0da146a6b3c9cf71e3f455'),
    title: 'Data Science Bootcamp: From Zero to Hero',
    status: 'published',
    category: 'Data Science',
    sub_category: 'Machine Learning',
    difficulty: 'beginner',
    is_free: true,
    price: 0,
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
    tags: ['python', 'data science', 'ml'],
    sections: []
  },
  {
    _id: new mongoose.Types.ObjectId('6a0da146a6b3c9cf71e3f456'),
    title: 'Mastering System Design',
    status: 'draft',
    category: 'Engineering',
    sub_category: 'Architecture',
    difficulty: 'advanced',
    is_free: false,
    price: 99.00,
    thumbnail_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?w=800&auto=format&fit=crop&q=60',
    tags: ['system design', 'scalability', 'backend'],
    sections: []
  }
];

async function seed() {
  const pgUrl = process.env.PG_DATABASE_URL;
  if (!pgUrl) {
    console.error('❌ PG_DATABASE_URL is not set in .env');
    process.exit(1);
  }

  // Connect to PG
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
    // Dynamically retrieve the first user from PostgreSQL to act as creator
    console.log('🔍 Fetching a creator user from PostgreSQL...');
    const users = await db.select({ id: schema.users.id }).from(schema.users).limit(1);
    
    if (users.length === 0) {
      throw new Error('No users found in PostgreSQL. Please run "npm run seed:dev" or "npm run seed:admin" first.');
    }

    const creatorId = users[0].id;
    console.log(`✅ Using creator user ID: ${creatorId}`);

    // Map sample courses to include this creatorId
    const coursesToInsert = SAMPLE_COURSES.map(course => ({
      ...course,
      pg_creator_id: creatorId,
    }));

    // 1. Seed MongoDB
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing Mongo
    await CourseModel.deleteMany({});
    console.log('🧹 Cleared existing courses in MongoDB');
    
    // Insert Mongo
    await CourseModel.insertMany(coursesToInsert);
    console.log(`🎉 Successfully seeded ${coursesToInsert.length} courses in MongoDB!`);

    // 2. Seed PostgreSQL Course Catalog
    console.log('🌱 Syncing courses to PostgreSQL course_catalog...');
    
    // Clear existing in PG
    await db.delete(schema.courseCatalog);
    console.log('🧹 Cleared existing course catalog in PostgreSQL');

    // Insert PG
    for (const course of coursesToInsert) {
      const lectureCount = course.sections?.reduce((sum: number, s: any) => sum + (s.lectures?.length || 0), 0) || 0;
      const totalDurationSecs = course.sections?.reduce((sum: number, s: any) => sum + (s.lectures?.reduce((lSum: number, l: any) => lSum + (l.duration_secs || 0), 0) || 0), 0) || 0;

      await db.insert(schema.courseCatalog).values({
        id: course._id.toString(),
        title: course.title,
        status: course.status as any,
        creatorId: course.pg_creator_id,
        category: course.category,
        subCategory: course.sub_category,
        difficulty: course.difficulty,
        isFree: course.is_free,
        price: String(course.price),
        lectureCount,
        totalDurationSecs,
        tags: course.tags,
      });
      console.log(`Synced: "${course.title}" (${course._id.toString()})`);
    }

    console.log('🎉 Successfully seeded courses in PostgreSQL course_catalog!');
    
    await mongoose.disconnect();
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    await client.end();
    process.exit(1);
  }
}

seed();
