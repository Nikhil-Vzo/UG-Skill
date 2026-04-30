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
      const { attemptId, frame } = req.body;
      if (!attemptId || !frame) {
        return res.status(400).json({ success: false, message: 'attemptId and frame are required' });
      }
      const result = await proctoringService.analyzeFrame(attemptId, frame);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }
};
