/**
 * fix-question-iscorrect.ts
 * One-time migration: sets isCorrect:true on the correct options for seed exam questions
 * that were created without isCorrect flags.
 * 
 * Run: npx ts-node -r tsconfig-paths/register src/db/fix-question-iscorrect.ts
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import mongoose from 'mongoose';
import { ExamQuestionBankModel } from './mongo/models/exam';

async function fixIsCorrect() {
  const mongoUrl = process.env.MONGO_URI;
  if (!mongoUrl) {
    console.error('❌ MONGO_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(mongoUrl);
  console.log('🔗 Connected to MongoDB');

  try {
    // Find all questions from the E2E seed exam
    const questions = await ExamQuestionBankModel.find({ source_exam: 'E2E Proctoring Test Exam' }).lean() as any[];
    console.log(`Found ${questions.length} seed exam question(s) to patch.`);

    for (const q of questions) {
      // Check if any option already has isCorrect set
      const alreadyHasCorrect = q.options?.some((o: any) => o.isCorrect === true);
      if (alreadyHasCorrect) {
        console.log(`  ✅ Question "${q.stem?.slice(0, 40)}..." already has isCorrect set, skipping.`);
        continue;
      }

      // Determine the correct option index based on stem
      let correctIndex = -1;
      let correctAnswer = '';

      if (q.stem?.includes('capital of AI')) {
        // "Localhost" is the intended answer (index 3 = option 4)
        correctIndex = q.options?.findIndex((o: any) => o.text === 'Localhost');
        correctAnswer = 'Localhost';
      } else if (q.stem?.includes('proctoring engine')) {
        // "WebSockets (Socket.io)" is the intended answer (index 1 = option 2)
        correctIndex = q.options?.findIndex((o: any) => o.text?.includes('WebSockets') || o.text?.includes('Socket.io'));
        correctAnswer = 'WebSockets (Socket.io)';
      }

      if (correctIndex === -1 || correctIndex === undefined) {
        console.warn(`  ⚠️ Could not determine correct answer for: "${q.stem?.slice(0, 50)}...". Skipping.`);
        continue;
      }

      // Update options to set isCorrect
      const updatedOptions = (q.options || []).map((o: any, idx: number) => ({
        ...o,
        isCorrect: idx === correctIndex,
      }));

      await ExamQuestionBankModel.findByIdAndUpdate(q._id, {
        $set: {
          options: updatedOptions,
          correct_answer: correctAnswer,
        },
      });

      console.log(`  ✅ Patched "${q.stem?.slice(0, 50)}..." → correct option: "${correctAnswer}"`);
    }

    // Also fix any MCQ questions that have correct_answer set but no isCorrect on options
    const questionsWithCorrectAnswer = await ExamQuestionBankModel.find({
      correct_answer: { $exists: true, $nin: [null, ''] },
      source_exam: { $ne: 'E2E Proctoring Test Exam' }, // Skip already-patched ones above
    }).lean() as any[];

    console.log(`\nFound ${questionsWithCorrectAnswer.length} other question(s) with correct_answer but potentially missing isCorrect flags.`);
    let patchedCount = 0;

    for (const q of questionsWithCorrectAnswer) {
      if (!q.options?.length) continue;
      const alreadyHasCorrect = q.options.some((o: any) => o.isCorrect === true);
      if (alreadyHasCorrect) continue;

      // Mark the option whose text matches correct_answer
      const correctText = String(q.correct_answer || '').trim();
      const correctIndex = q.options.findIndex((o: any) =>
        String(o.text || '').trim() === correctText
      );

      if (correctIndex === -1) continue;

      const updatedOptions = q.options.map((o: any, idx: number) => ({
        ...o,
        isCorrect: idx === correctIndex,
      }));

      await ExamQuestionBankModel.findByIdAndUpdate(q._id, {
        $set: { options: updatedOptions },
      });
      patchedCount++;
    }

    console.log(`  ✅ Patched ${patchedCount} additional question(s).`);
    console.log('\n🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

fixIsCorrect();
