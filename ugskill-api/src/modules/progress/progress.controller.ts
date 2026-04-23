import { Request, Response, NextFunction } from 'express';
import { progressService } from './progress.service';
import { successResponse } from '../../lib/response';

export class ProgressController {
  async completeLecture(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const { courseId, lectureId } = req.params;

      const result = await progressService.markLectureComplete(studentId, courseId as string, lectureId as string);

      res.status(200).json(successResponse(result.message, result.progress));
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const { courseId } = req.params;

      const summary = await progressService.getProgressSummary(studentId, courseId as string);

      res.status(200).json(successResponse('Progress summary retrieved', summary));
    } catch (error) {
      next(error);
    }
  }

  async getStreak(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;

      const streak = await progressService.getStudentStreak(studentId);

      res.status(200).json(successResponse('Student streak retrieved', streak));
    } catch (error) {
      next(error);
    }
  }
}

export const progressController = new ProgressController();
