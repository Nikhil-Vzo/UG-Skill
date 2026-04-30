import { examRepository } from './exam.repository';
import { examDefinitionRepository } from './exam-definition.repository';
import { examQuestionRepository } from './exam-question.repository';
import { examAttemptRepository } from './exam-attempt.repository';
import { examResponseRepository } from './exam-response.repository';
import { ExamProctoringEventModel } from '../../db/mongo/models/exam';
import { proctoringService } from '../proctoring/proctoring.service';
import { AppError, NotFoundError, ValidationError } from '../../lib/errors';
import { db } from '../../config/postgres';

export class ExamService {
  // --- EXAM CRUD ---
  async createExam(creatorId: string, data: any) {
    // Extract mongo specific definition data
    const { mongoDefinition, ...pgData } = data;
    
    // 1. Create PG Exam
    const exam = await examRepository.create({
      ...pgData,
      creatorId
    });

    // 2. Create Mongo Definition
    if (mongoDefinition) {
      await examDefinitionRepository.create(exam.id, mongoDefinition);
    } else {
      await examDefinitionRepository.create(exam.id, { sections: [] });
    }

    return exam;
  }

  async getExam(id: string) {
    const exam = await examRepository.findById(id);
    if (!exam) throw new NotFoundError('Exam not found');

    const definition = await examDefinitionRepository.findByPgExamId(id);

    return { ...exam, definition };
  }

  async listExams(filters: any) {
    return examRepository.findMany(filters);
  }

  async updateExam(id: string, data: any) {
    const { mongoDefinition, ...pgData } = data;

    let updatedParams: any = {};

    if (Object.keys(pgData).length > 0) {
      updatedParams.exam = await examRepository.update(id, pgData);
    }
    
    if (mongoDefinition) {
      const def = await examDefinitionRepository.findByPgExamId(id);
      if (def) {
        updatedParams.definition = await examDefinitionRepository.update(id, mongoDefinition);
      } else {
        updatedParams.definition = await examDefinitionRepository.create(id, mongoDefinition);
      }
    }

    return updatedParams;
  }

  // --- SECTIONS & BATCH ACCESS ---
  async addSection(examId: string, data: any) {
    return examRepository.createSection({ ...data, examId });
  }

  async grantBatchAccess(examId: string, batchId: string, grantedBy?: string) {
    return examRepository.grantBatchAccess(examId, batchId, grantedBy);
  }

  // --- QUESTION BANK ---
  async createQuestion(creatorId: string, data: any) {
    return examQuestionRepository.create({ ...data, pg_created_by: creatorId });
  }

  async listQuestions(filters: any) {
    return examQuestionRepository.findMany(filters);
  }

  // --- ATTEMPT FLOW ---
  async startAttempt(studentId: string, examId: string, meta: { ipAddress?: string; deviceFingerprint?: string }) {
    // 1. Check if exam exists
    const exam = await examRepository.findById(examId);
    if (!exam) throw new NotFoundError('Exam not found');

    // 2. Compute attempt number
    const count = await examAttemptRepository.getAttemptCount(studentId, examId);
    const attemptNumber = Number(count) + 1;

    // 3. Create PG Attempt (status: in_progress)
    const attempt = await examAttemptRepository.createAttempt({
      examId,
      studentId,
      attemptNumber,
      ipAddress: meta.ipAddress,
      deviceFingerprint: meta.deviceFingerprint,
      status: 'in_progress'
    });

    // 4. Create Mongo Response Shell
    await examResponseRepository.create({
      pg_attempt_id: attempt.id,
      pg_student_id: studentId,
      pg_exam_id: examId,
    });

    return attempt;
  }

  async saveIncrementalResponse(studentId: string, attemptId: string, responses: any[]) {
    // We expect the controller to just pass the array. We overwrite the previous list.
    return examResponseRepository.saveIncremental(attemptId, responses);
  }

  async submitAttempt(studentId: string, attemptId: string, data: { timeTakenSecs?: number; responses?: any[] }) {
    // 1. Mark as submitted in Mongo
    const responseDoc = await examResponseRepository.finalize(attemptId, data.responses);

    // 2. Update PG attempt
    const attempt = await examAttemptRepository.updateAttempt(attemptId, {
      status: 'submitted',
      submittedAt: new Date(),
      timeTakenSecs: data.timeTakenSecs,
    });

    // 3. Score the attempt synchronously (as per MVP plan)
    // NOTE: In production or later phases, offload to BullMQ: scoringQueue.add({ attemptId });
    await this.computeScore(attemptId);

    return attempt;
  }

  async computeScore(attemptId: string) {
    // Fetches the response document and the exam config, computes the score, and stores it in Postgres.
    const attempt = await examAttemptRepository.findAttemptById(attemptId);
    const responseDoc = await examResponseRepository.findByAttemptId(attemptId);
    const exam = await examRepository.findById(attempt.examId);

    if (!responseDoc || !exam) return;

    // VERY simplified manual scoring for MVP:
    // This expects `responses` array to have objects like { marks_awarded: 2 } evaluated before, 
    // or we evaluate them here against a key. 
    // Since we don't have the key matching logic complexified yet, we generate a mock/placeholder score.
    
    // In a real scenario, we iterate through responseDoc.responses and against the QuestionBank models
    let totalScore = 0;
    
    if (responseDoc.responses && Array.isArray(responseDoc.responses)) {
      // Just a mock placeholder: counting 1 mark per response provided as a fallback
      totalScore = responseDoc.responses.length; 
    }

    const maxScore = Number(exam.totalMarks || 100);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = exam.passPercent ? percentage >= Number(exam.passPercent) : true;

    // Write to pg exam_scores
    const scoreRow = await examAttemptRepository.createScore({
      attemptId: attempt.id,
      studentId: attempt.studentId,
      examId: attempt.examId,
      totalScore: totalScore.toString(),
      maxScore: maxScore.toString(),
      percentage: percentage.toString(),
      passed,
      timeTakenSecs: attempt.timeTakenSecs
    });

    // Write ranking placeholder
    // A real implementation would recalculate ranks globally or add to a sorted set in Redis
    await examAttemptRepository.upsertRanking({
      examId: attempt.examId,
      studentId: attempt.studentId,
      rank: 1, // mock rank
      score: totalScore.toString(),
      percentile: "100.00"
    });

    return scoreRow;
  }

  async getResult(attemptId: string) {
    const attempt = await examAttemptRepository.findAttemptById(attemptId);
    const score = await examAttemptRepository.getScoreByAttempt(attemptId);
    const response = await examResponseRepository.findByAttemptId(attemptId);

    return { attempt, score, response };
  }

  // --- PROCTORING EVENTS ---

  async ingestProctoringEvent(studentId: string, data: any) {
    return proctoringService.ingestEvent({
      attemptId: data.pg_session_id || data.attemptId,
      examId: data.pg_exam_id || data.examId,
      studentId,
      type: data.event_type || data.type,
      severity: (data.severity || 'LOW').toUpperCase() as any,
      aiConfidence: data.confidence || data.aiConfidence,
      metadata: data.metadata,
      evidenceUrl: data.evidence_snapshot_url || data.evidenceUrl
    });
  }

  async listProctoringEvents(filters: any) {
    // Direct mongo query for events
    const query: any = { module: 'exam' };
    if (filters.studentId) query.pg_student_id = filters.studentId;
    if (filters.sessionId) query.session_id = filters.sessionId;
    if (filters.eventType) query.event_type = filters.eventType;
    if (filters.severity) query.severity = filters.severity;

    const data = await ExamProctoringEventModel.find(query).sort({ timestamp: -1 }).limit(100).lean();
    return { data };
  }
}

export const examService = new ExamService();
