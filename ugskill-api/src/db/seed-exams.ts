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
import mongoose from 'mongoose';
import { ExamQuestionBankModel, ExamDefinitionModel } from './mongo/models/exam';

async function seedExams() {
  const pgUrl = process.env.PG_DATABASE_URL;
  if (!pgUrl) {
    console.error('❌ PG_DATABASE_URL is not set');
    process.exit(1);
  }

  const mongoUrl = process.env.MONGO_URI;
  if (!mongoUrl) {
    console.error('❌ MONGO_URI is not set');
    process.exit(1);
  }

  const client = postgres(pgUrl, { ssl: 'require', max: 1 });
  const db = drizzle(client, { schema });

  await mongoose.connect(mongoUrl);
  console.log('🔗 Connected to Postgres & MongoDB.');

  try {
    // 1. Get Admin User
    const [admin] = await db.select().from(schema.users).where(eq(schema.users.email, 'admin@ugskill.com')).limit(1);
    if (!admin) {
      console.error('❌ Admin user not found. Run seed:admin first.');
      process.exit(1);
    }

    // 1.5 Delete existing E2E exams to prevent duplicates
    console.log('🗑️ Cleaning up existing E2E exams...');
    const existingExams = await db.select().from(schema.exams).where(eq(schema.exams.title, 'E2E Proctoring Test Exam'));
    for (const ex of existingExams) {
      await db.delete(schema.examBatchAccess).where(eq(schema.examBatchAccess.examId, ex.id));
      await db.delete(schema.examSections).where(eq(schema.examSections.examId, ex.id));
      await db.delete(schema.exams).where(eq(schema.exams.id, ex.id));
      // Delete from Mongo too
      await ExamDefinitionModel.deleteOne({ pg_exam_id: ex.id });
    }
    
    // Clear old test questions from Mongo
    await ExamQuestionBankModel.deleteMany({ source_exam: 'E2E Proctoring Test Exam' });

    // 2. Create Exam
    console.log('📝 Creating test exam...');
    const [exam] = await db.insert(schema.exams).values({
      title: 'E2E Proctoring Test Exam',
      description: 'This exam is for testing the AI Proctoring Engine.',
      durationMinutes: 30,
      totalMarks: '100',
      passPercent: '40',
      creatorId: admin.id,
      status: 'published',
      mode: 'live',
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

    // 4. Create Questions in MongoDB
    console.log('📝 Creating questions in MongoDB...');
    const question1 = await ExamQuestionBankModel.create({
      type: 'mcq',
      status: 'published',
      stem: 'What is the capital of AI?',
      options: [
        { id: '1', text: 'Silicon Valley' },
        { id: '2', text: 'Neural Network' },
        { id: '3', text: 'Data Center' },
        { id: '4', text: 'Localhost' }
      ],
      explanation: 'It is a joke.',
      pg_created_by: admin.id,
      source_exam: 'E2E Proctoring Test Exam',
      marks: 10,
      difficulty: 'easy'
    });
    
    const question2 = await ExamQuestionBankModel.create({
      type: 'mcq',
      status: 'published',
      stem: 'Which protocol is used by the proctoring engine for real-time alerts?',
      options: [
        { id: '1', text: 'HTTP/1.1' },
        { id: '2', text: 'WebSockets (Socket.io)' },
        { id: '3', text: 'FTP' },
        { id: '4', text: 'SMTP' }
      ],
      explanation: 'Socket.io enables real-time duplex communication.',
      pg_created_by: admin.id,
      source_exam: 'E2E Proctoring Test Exam',
      marks: 10,
      difficulty: 'medium'
    });

    // Link questions to the exam via ExamDefinition
    await ExamDefinitionModel.create({
      pg_exam_id: exam.id,
      sections: [
        {
          sectionId: section.id,
          name: section.name,
          question_sequence: [question1._id, question2._id]
        }
      ]
    });

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
    await mongoose.disconnect();
  }
}

seedExams();
