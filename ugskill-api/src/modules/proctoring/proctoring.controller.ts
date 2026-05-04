import { Request, Response, NextFunction } from 'express';
import { proctoringService } from './proctoring.service';
import { successResponse } from '../../lib/response';

export const proctoringController = {
  ingestEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user!.userId;
      const event = await proctoringService.ingestEvent({
        ...req.body,
        studentId
      });
      res.status(201).json(successResponse(event));
    } catch (error) {
      next(error);
    }
  },

  getAttemptEvents: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await proctoringService.getEventsByAttempt(req.params.attemptId as string);
      res.json(successResponse(events));
    } catch (error) {
      next(error);
    }
  },

  getRecentIncidents: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Number(req.query.limit) || 20;
      const incidents = await proctoringService.getRecentIncidents(limit);
      res.json(successResponse(incidents));
    } catch (error) {
      next(error);
    }
  },

  analyzeFrame: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { attemptId, frame, examId, studentId, capturedAt } = req.body;
      if (!attemptId || !frame) {
        return res.status(400).json({ success: false, message: 'attemptId and frame are required' });
      }

      if (attemptId === 'preflight') {
        // Pre-flight requires synchronous response to unlock the "Begin Exam" button
        const result = await proctoringService.analyzeFrame(attemptId, frame, examId, studentId);
        return res.json(successResponse(result.data));
      }

      // During active exam, queue the heavy AI workload and return immediately
      const { aiFrameQueue } = await import('../../config/queue');
      await aiFrameQueue.add('analyze-frame', {
        attemptId,
        examId,
        studentId: studentId || req.user?.userId,
        frameBase64: frame,
        capturedAt: capturedAt || new Date().toISOString(),
      });

      res.json(successResponse({ status: 'queued' }));
    } catch (error) {
      next(error);
    }
  },

  overrideViolation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { attemptId } = req.params;
      const { eventId, reason } = req.body;
      const adminId = req.user!.userId;
      if (!eventId || !reason) {
        return res.status(400).json({ success: false, message: 'eventId and reason are required' });
      }
      const event = await proctoringService.overrideEvent(attemptId as string, eventId, adminId, reason);
      res.json(successResponse(event));
    } catch (error) {
      next(error);
    }
  },

  getAttemptSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await proctoringService.getAttemptSummary(req.params.attemptId as string);
      res.json(successResponse(summary));
    } catch (error) {
      next(error);
    }
  }
};
