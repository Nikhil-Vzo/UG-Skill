import { examRepository } from './exam.repository';
import { examDefinitionRepository } from './exam-definition.repository';
import { examQuestionRepository } from './exam-question.repository';
import { examAttemptRepository } from './exam-attempt.repository';
import { examResponseRepository } from './exam-response.repository';
import { ExamProctoringEventModel } from '../../db/mongo/models/exam';
import { proctoringService } from '../proctoring/proctoring.service';
import { AppError, NotFoundError, ValidationError } from '../../lib/errors';
import { db } from '../../config/postgres';
import { logger } from '../../lib/logger';

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
    const result = await examRepository.findMany(filters);
    
    // Fetch user attempts if studentId is provided
    let userAttemptsMap = new Map<string, any>();
    if (filters.studentId) {
      const attempts = await examAttemptRepository.findManyAttempts({ studentId: filters.studentId, limit: 1000 });
      attempts.data.forEach(a => {
        // Keep the latest/highest status. For MVP we just care if ANY attempt is submitted/terminated
        if (a.status === 'submitted' || a.status === 'terminated') {
          userAttemptsMap.set(a.examId, a);
        } else if (!userAttemptsMap.has(a.examId)) {
          userAttemptsMap.set(a.examId, a);
        }
      });
    }

    // Inject virtual statuses for student consumption
    const enrichedData = result.data.map((exam: any) => {
      if (exam.status !== 'published') return exam;

      const now = new Date();
      const scheduled = new Date(exam.scheduledAt);
      const duration = Number(exam.durationMinutes) || 60;
      const endsAt = new Date(scheduled.getTime() + duration * 60000);

      let virtualStatus = 'published';
      const userAttempt = userAttemptsMap.get(exam.id);

      if (userAttempt && (userAttempt.status === 'submitted' || userAttempt.status === 'terminated')) {
        virtualStatus = 'completed';
      } else if (now < scheduled) {
        virtualStatus = 'upcoming';
      } else if (now >= scheduled && now <= endsAt) {
        virtualStatus = 'live';
      } else if (now > endsAt) {
        virtualStatus = 'missed';
      }

      // If completed, attach score info if available
      let score = undefined;
      // Note: Full score might require another query or joining, but frontend expects score and maxScore
      // The attempt might not hold score directly, but we at least mark it completed.

      return { ...exam, status: virtualStatus, originalStatus: 'published' };
    });

    return { ...result, data: enrichedData };
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

  async listBatchAccess(examId: string) {
    return examRepository.listBatchAccess(examId);
  }

  async revokeBatchAccess(examId: string, batchId: string) {
    return examRepository.revokeBatchAccess(examId, batchId);
  }

  // --- QUESTION BANK ---
  async createQuestion(creatorId: string, data: any) {
    return examQuestionRepository.create({ ...data, pg_created_by: creatorId });
  }

  async listQuestions(filters: any) {
    return examQuestionRepository.findMany(filters);
  }

  // --- ATTEMPT FLOW ---
  async startAttempt(studentId: string, examId: string, meta: { ipAddress?: string; deviceFingerprint?: string } = {}) {
    logger.info('Starting exam attempt', { studentId, examId });
    
    try {
      // 1. Check if exam exists
      const exam = await examRepository.findById(examId);
      if (!exam) throw new NotFoundError('Exam not found');

      // 2. Compute attempt number
      const countStr = await examAttemptRepository.getAttemptCount(studentId, examId);
      const attemptNumber = Number(countStr || 0) + 1;

      logger.debug('Creating attempt entry', { examId, studentId, attemptNumber });

      // 3. Create PG Attempt (status: in_progress)
      const attempt = await examAttemptRepository.createAttempt({
        examId,
        studentId,
        attemptNumber,
        ipAddress: meta.ipAddress,
        deviceFingerprint: meta.deviceFingerprint,
        status: 'in_progress'
      });

      if (!attempt) {
        throw new AppError('Database failed to return the new attempt record', 500);
      }

      // 4. Create Mongo Response Shell
      try {
        await examResponseRepository.create({
          pg_attempt_id: attempt.id,
          pg_student_id: studentId,
          pg_exam_id: examId,
        });
      } catch (mongoErr: any) {
        logger.error('Failed to create Mongo response shell', { error: mongoErr.message, attemptId: attempt.id });
        // We might want to rollback PG attempt here if atomic consistency is required
        throw new AppError(`Exam initialization failed (Storage Error): ${mongoErr.message}`, 500);
      }

      // 5. Fetch questions from definition
      const def = await examDefinitionRepository.findByPgExamId(examId);
      let questionsList: any[] = [];
      if (def && def.sections) {
        const qIds: string[] = [];
        def.sections.forEach((s: any) => {
          if (s.question_sequence) {
            qIds.push(...s.question_sequence);
          }
        });
        
        if (qIds.length > 0) {
          try {
            const { ExamQuestionBankModel } = require('../../db/mongo/models/exam');
            const rawQs = await ExamQuestionBankModel.find({ _id: { $in: qIds } }).lean();
            
            // Ensure ordering matches the sequence
            questionsList = qIds.map(qid => {
              const q: any = rawQs.find((rq: any) => rq._id.toString() === qid.toString());
              if (!q) return null;
              return {
                id: q._id.toString(),
                text: q.stem || '',
                options: q.options ? q.options.map((o: any) => o.text || o) : [],
                marks: q.marks || 1
              };
            }).filter(Boolean);
          } catch (qErr: any) {
            logger.warn('Failed to fetch questions from bank', { error: qErr.message, examId });
          }
        }
      }

      return {
        attemptId: attempt.id,
        questions: questionsList,
        durationSeconds: (Number(exam.durationMinutes) || 60) * 60,
        examTitle: exam.title
      };
    } catch (error: any) {
      logger.error('startAttempt failed', { error: error.message, stack: error.stack, studentId, examId });
      if (error instanceof AppError || error instanceof NotFoundError) throw error;
      throw new AppError(`Internal server error during exam start: ${error.message}`, 500);
    }
  }

  async saveIncrementalResponse(studentId: string, attemptId: string, data: any) {
    if (data.responses) {
      return examResponseRepository.saveIncremental(attemptId, data.responses);
    }
    
    if (data.questionId !== undefined) {
      return examResponseRepository.upsertSingleResponse(attemptId, {
        question_id: data.questionId,
        selected_option: data.selectedOption,
        answered_at: new Date()
      });
    }
    
    return null;
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

  async adminTerminateAttempt(attemptId: string, adminId: string) {
    const attempt = await examAttemptRepository.findAttemptById(attemptId);
    if (!attempt) throw new NotFoundError('Attempt not found');

    const updated = await examAttemptRepository.updateAttempt(attemptId, {
      status: 'terminated',
      proctoringVerdict: 'admin_terminated',
      submittedAt: new Date(),
    });

    // Log the admin action
    await proctoringService.ingestEvent({
      attemptId,
      examId: attempt.examId,
      studentId: attempt.studentId,
      type: 'admin_terminate',
      severity: 'CRITICAL',
      metadata: { terminatedBy: adminId, reason: 'Admin manual termination' },
    });

    return updated;
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
