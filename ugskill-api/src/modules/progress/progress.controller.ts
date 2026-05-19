import { Request, Response, NextFunction } from 'express';
import { progressService } from './progress.service';
import { successResponse } from '../../lib/response';

export class ProgressController {
  async completeLecture(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const { courseId, lectureId } = req.params;

      const result = await progressService.markLectureComplete(studentId, courseId as string, lectureId as string);

      res.status(200).json(successResponse(result.progress, { message: result.message }));
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const { courseId } = req.params;

      const summary = await progressService.getProgressSummary(studentId, courseId as string);

      res.status(200).json(successResponse(summary, { message: 'Progress summary retrieved' }));
    } catch (error) {
      next(error);
    }
  }

  async getStreak(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;

      const streak = await progressService.getStudentStreak(studentId);

      res.status(200).json(successResponse(streak, { message: 'Student streak retrieved' }));
    } catch (error) {
      next(error);
    }
  }

  async getBookmarks(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const { courseId, lectureId } = req.params;

      const bookmarks = await progressService.getBookmarks(studentId, courseId as string, lectureId as string);

      res.status(200).json(successResponse(bookmarks, { message: 'Bookmarks retrieved' }));
    } catch (error) {
      next(error);
    }
  }

  async saveBookmarks(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const { courseId, lectureId } = req.params;
      const { bookmarks } = req.body;

      const updated = await progressService.saveBookmarks(studentId, courseId as string, lectureId as string, bookmarks);

      res.status(200).json(successResponse(updated, { message: 'Bookmarks saved' }));
    } catch (error) {
      next(error);
    }
  }
}

export const progressController = new ProgressController();
