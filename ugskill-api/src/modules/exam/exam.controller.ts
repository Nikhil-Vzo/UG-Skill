import { Request, Response, NextFunction } from 'express';
import { examService } from './exam.service';
import { logger } from '../../lib/logger';
import { logAction } from '../audit/audit.service';

// --- EXAM CRUD ---

export const createExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creatorId = req.user!.userId;
    const exam = await examService.createExam(creatorId, req.body);
    await logAction({
      actorId: creatorId,
      action: 'EXAM_CREATED',
      entityType: 'exam',
      entityId: exam.id,
      newValue: req.body,
      ipAddress: req.ip,
    });
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

export const getExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const exam = await examService.getExam(id);
    res.json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

export const listExams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = req.user?.roles || [];
    const isStudent = roles.includes('student') && !roles.some((r: string) => ['admin', 'super_admin', 'creator', 'hr'].includes(r));
    
    const filters: any = { ...req.query };
    
    if (isStudent) {
      filters.studentId = req.user?.userId;
    }

    logger.info(`Listing exams for user ${req.user?.userId} with roles ${roles}. isStudent: ${isStudent}`);
    const exams = await examService.listExams(filters);
    logger.info(`Found ${exams.data.length} exams. Total: ${exams.pagination?.total ?? exams.data.length}`);
    res.json({ success: true, ...exams });
  } catch (error) {
    next(error);
  }
};

export const listLiveExams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const liveExams = await examService.listLiveExams();
    res.json({ success: true, data: liveExams });
  } catch (error) {
    next(error);
  }
};

export const listRecentIncidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const incidents = await examService.listRecentIncidents(Number.isFinite(limit) ? limit : 50);
    res.json({ success: true, data: incidents });
  } catch (error) {
    next(error);
  }
};

export const updateExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const updated = await examService.updateExam(id, req.body);
    await logAction({
      actorId: req.user!.userId,
      action: 'EXAM_UPDATED',
      entityType: 'exam',
      entityId: id,
      newValue: req.body,
      ipAddress: req.ip,
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await examService.deleteExam(id);
    await logAction({
      actorId: req.user!.userId,
      action: 'EXAM_DELETED',
      entityType: 'exam',
      entityId: id,
      ipAddress: req.ip,
    });
    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// --- SECTIONS & BATCH ACCESS ---

export const addSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const examId = req.params.id as string;
    const section = await examService.addSection(examId, req.body);
    res.status(201).json({ success: true, data: section });
  } catch (error) {
    next(error);
  }
};

export const replaceSections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const examId = req.params.id as string;
    const sections = await examService.replaceSections(examId, req.body.sections);
    res.json({ success: true, data: sections });
  } catch (error) {
    next(error);
  }
};

export const grantBatchAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const examId = req.params.id as string;
    const { batchId } = req.body;
    const access = await examService.grantBatchAccess(examId, batchId, req.user!.userId);
    await logAction({
      actorId: req.user!.userId,
      action: 'EXAM_BATCH_ACCESS_GRANTED',
      entityType: 'exam',
      entityId: examId,
      newValue: { batchId },
      ipAddress: req.ip,
    });
    res.status(201).json({ success: true, data: access });
  } catch (error) {
    next(error);
  }
};

export const listBatchAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const examId = req.params.id as string;
    const accessList = await examService.listBatchAccess(examId);
    res.json({ success: true, data: accessList });
  } catch (error) {
    next(error);
  }
};

export const revokeBatchAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const batchId = req.params.batchId as string;
    await examService.revokeBatchAccess(id, batchId);
    res.json({ success: true, message: 'Access revoked' });
  } catch (error) {
    next(error);
  }
};

// --- QUESTION BANK ---

export const createQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creatorId = req.user!.userId;
    const question = await examService.createQuestion(creatorId, req.body);
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

export const listQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const questions = await examService.listQuestions(req.query);
    res.json({ success: true, ...questions });
  } catch (error) {
    next(error);
  }
};

export const updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const questionId = req.params.questionId as string;
    const question = await examService.updateQuestion(questionId, req.body);
    res.json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

// --- ATTEMPTS ---

export const startAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const examId = req.params.id as string;
    const roles = req.user?.roles || [];
    const isAdminPreview = roles.some((role: string) => ['admin', 'super_admin', 'creator', 'faculty'].includes(role));
    const attempt = await examService.startAttempt(req.user!.userId, examId, { ...req.body, isAdminPreview });
    res.status(201).json({ success: true, data: attempt });
  } catch (error) {
    next(error);
  }
};

export const saveIncrementalResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attemptId = req.params.attemptId as string;
    const updated = await examService.saveIncrementalResponse(req.user!.userId, attemptId, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const submitAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attemptId = req.params.attemptId as string;
    const attempt = await examService.submitAttempt(req.user!.userId, attemptId, req.body);
    res.json({ success: true, data: attempt });
  } catch (error) {
    next(error);
  }
};

export const getResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attemptId = req.params.attemptId as string;
    const result = await examService.getResult(attemptId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const adminTerminateAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attemptId = (req.params.attemptId || req.params.id) as string;
    const adminId = req.user!.userId;
    const attempt = await examService.adminTerminateAttempt(attemptId, adminId);
    res.json({ success: true, data: attempt });
  } catch (error) {
    next(error);
  }
};

export const adminFlagAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attemptId = (req.params.attemptId || req.params.id) as string;
    const adminId = req.user!.userId;
    const attempt = await examService.adminFlagAttempt(attemptId, adminId, req.body?.reason);
    res.json({ success: true, data: attempt });
  } catch (error) {
    next(error);
  }
};

export const getProctoringReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const examId = (req.params.examId || req.params.id) as string;
    const report = await examService.getProctoringReport(examId);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// --- PROCTORING ---

export const ingestProctoringEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await examService.ingestProctoringEvent(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

export const listProctoringEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await examService.listProctoringEvents(req.query);
    res.json({ success: true, ...events });
  } catch (error) {
    next(error);
  }
};

export const reportQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const examId = req.params.id as string;
    const attemptId = req.params.attemptId as string;
    const questionId = req.params.questionId as string;
    const studentId = req.user!.userId;
    const { issueType, description } = req.body;
    const report = await examService.reportQuestion({
      examId,
      attemptId,
      studentId,
      questionId,
      issueType,
      description,
    });
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};
