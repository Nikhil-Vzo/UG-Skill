/**
 * seed-exams.ts
 * Seeds a test exam with proctoring enabled.
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './pg/schema';
import { eq } from 'drizzle-orm';

async function seedExams() {
  const pgUrl = process.env.PG_DATABASE_URL;
  if (!pgUrl) {
    console.error('❌ PG_DATABASE_URL is not set');
    process.exit(1);
  }

  const client = postgres(pgUrl, { ssl: 'require', max: 1 });
  const db = drizzle(client, { schema });

  console.log('🔗 Connected to DB.');

  try {
    // 1. Get Admin User
    const [admin] = await db.select().from(schema.users).where(eq(schema.users.email, 'admin@ugskill.com')).limit(1);
    if (!admin) {
      console.error('❌ Admin user not found. Run seed:admin first.');
      process.exit(1);
    }

    // 2. Create Exam
    console.log('📝 Creating test exam...');
    const [exam] = await db.insert(schema.exams).values({
      title: 'E2E Proctoring Test Exam',
      description: 'This exam is for testing the AI Proctoring Engine.',
      durationMinutes: 30,
      totalMarks: '100',
      passPercent: '40',
      creatorId: admin.id,
      status: 'live',
      isProctored: true,
      gazeThreshold: 5,
      faceTimeoutSeconds: 10,
      allowMultipleFaces: false,
      autoTerminateScore: 80,
      frameCaptureIntervalSec: 5,
    }).returning();

    console.log(`✅ Exam created: ${exam.id}`);

    // 3. Create a Section
    const [section] = await db.insert(schema.examSections).values({
      examId: exam.id,
      name: 'General Knowledge',
      sectionOrder: 1,
    }).returning();

    // 4. Create a Question (Note: Questions are in MongoDB, skipping PG insert)
    /*
    await db.insert(schema.examQuestions).values({
      examId: exam.id,
      sectionId: section.id,
      content: 'What is the capital of AI?',
      type: 'mcq',
      options: ['Sillicon Valley', 'Neural Network', 'Data Center', 'Localhost'],
      correctAnswer: 'Localhost',
      marks: 10,
      difficulty: 'easy',
    });
    */

    // 5. Grant Access to Test Student's Batch
    console.log('🔑 Granting exam access to test student...');
    const [student] = await db.select().from(schema.users).where(eq(schema.users.email, 'student@ugskill.com')).limit(1);
    
    if (student) {
      // Find a batch this student belongs to
      const [enrollment] = await db.select().from(schema.batchMembers).where(eq(schema.batchMembers.userId, student.id)).limit(1);
      
      if (enrollment) {
        console.log(`📡 Linking exam to batch: ${enrollment.batchId}`);
        await db.insert(schema.examBatchAccess).values({
          examId: exam.id,
          batchId: enrollment.batchId,
          grantedBy: admin.id,
        }).onConflictDoNothing();
      } else {
        console.warn('⚠️ Student not enrolled in any batch. Creating a default batch...');
        const [batch] = await db.insert(schema.batches).values({
          name: 'E2E Test Batch',
          description: 'Batch for end-to-end testing',
        }).returning();
        
        await db.insert(schema.batchMembers).values({
          batchId: batch.id,
          userId: student.id,
          role: 'student',
        });
        
        await db.insert(schema.examBatchAccess).values({
          examId: exam.id,
          batchId: batch.id,
          grantedBy: admin.id,
        });
      }
    } else {
      console.error('❌ Test student (test@ugskill.com) not found.');
    }
    
    console.log('🎉 Exam Seeding Complete!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await client.end();
  }
}

seedExams();
