import { Request, Response, NextFunction } from 'express';
import { examService } from './exam.service';

// --- EXAM CRUD ---

export const createExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creatorId = req.user!.userId;
    const exam = await examService.createExam(creatorId, req.body);
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
    const filters = { ...req.query, studentId: req.user?.userId };
    const exams = await examService.listExams(filters);
    res.json({ success: true, ...exams });
  } catch (error) {
    next(error);
  }
};

export const updateExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const updated = await examService.updateExam(id, req.body);
    res.json({ success: true, data: updated });
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

export const grantBatchAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const examId = req.params.id as string;
    const { batchId } = req.body;
    const access = await examService.grantBatchAccess(examId, batchId, req.user!.userId);
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

// --- ATTEMPTS ---

export const startAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const examId = req.params.id as string;
    const attempt = await examService.startAttempt(req.user!.userId, examId, req.body);
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
    const attemptId = req.params.attemptId as string;
    const adminId = req.user!.userId;
    const attempt = await examService.adminTerminateAttempt(attemptId, adminId);
    res.json({ success: true, data: attempt });
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
