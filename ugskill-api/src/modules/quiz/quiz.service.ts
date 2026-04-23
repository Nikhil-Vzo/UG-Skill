import { quizDefinitionRepository } from './quiz-definition.repository';
import { quizAttemptRepository } from './quiz-attempt.repository';
import { quizAttemptDetailRepository } from './quiz-attempt-detail.repository';
import { IQuizDefinition } from '../../db/mongo/models/lms';
import { AppError } from '../../lib/errors';
import mongoose from 'mongoose';

export class QuizService {
  async createDefinition(creatorId: string, data: any) {
    data.pg_creator_id = creatorId;
    const quiz = await quizDefinitionRepository.create(data);
    return quiz;
  }

  async submitAttempt(
    studentId: string,
    quizId: string,
    courseId: string,
    timeTakenSecs: number,
    responses: any[]
  ) {
    // 1. Fetch Definition
    const quizDef: any = await quizDefinitionRepository.findById(quizId);
    if (!quizDef) {
      throw new AppError('Quiz definition not found', 404);
    }

    // 2. Constraints Check
    const prevAttempts = await quizAttemptRepository.getLatestAttemptNumber(studentId, quizId);
    const maxAttempts = quizDef.config?.max_attempts || 3;

    if (prevAttempts >= maxAttempts) {
      throw new AppError(`Maximum attempts (${maxAttempts}) reached for this quiz.`, 403);
    }

    // 3. Auto-Grading Logic
    let score = 0;
    let maxScore = 0;
    const questions = quizDef.questions || [];

    const detailedResponses = responses.map((r: any) => {
      const q = questions[r.questionIdx];
      if (!q) return { ...r, isCorrect: false };

      const weight = q.score_weight || 1;
      maxScore += weight;

      // Simple equality check (arrays require deeper equality for multiple_choice)
      let isCorrect = false;
      if (Array.isArray(q.correct_answer) && Array.isArray(r.answer)) {
        isCorrect = q.correct_answer.sort().join(',') === r.answer.sort().join(',');
      } else {
        isCorrect = String(q.correct_answer) === String(r.answer);
      }

      if (isCorrect) score += weight;

      return {
        ...r,
        question_text: q.text,
        isCorrect,
        weight,
      };
    });

    const passPercentage = quizDef.config?.pass_percentage || 50;
    const currentPercent = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const passed = currentPercent >= passPercentage;

    // 4. Save to PG First (For Attempt Hub)
    const attempt = await quizAttemptRepository.saveAttempt({
      studentId,
      quizId,
      courseId,
      attemptNumber: prevAttempts + 1,
      score,
      maxScore,
      passed,
      timeTakenSecs,
    });

    // 5. Save detailed response into Mongo
    await quizAttemptDetailRepository.saveDetail({
      pg_attempt_id: attempt.id,
      pg_student_id: studentId,
      quiz_id: new mongoose.Types.ObjectId(quizId),
      responses: detailedResponses,
    });

    return {
      attemptId: attempt.id,
      score,
      maxScore,
      passed,
      attemptNumber: attempt.attemptNumber,
      feedback: passed ? 'Congratulations, you passed!' : 'You did not pass. Please try again.',
    };
  }
}

export const quizService = new QuizService();
