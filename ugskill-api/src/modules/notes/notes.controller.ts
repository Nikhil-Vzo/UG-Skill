import { Request, Response, NextFunction } from 'express';
import { StudentNote } from './notes.model';
import { successResponse } from '../../lib/response';

export const notesController = {
  /** GET /api/v1/lms/notes?courseId=&lectureId= */
  getNote: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user!.userId;
      const { courseId, lectureId } = req.query as Record<string, string>;

      const note = await StudentNote.findOne({ studentId, courseId, lectureId }).lean();
      res.json(successResponse(note || { studentId, courseId, lectureId, content: '' }));
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/lms/notes  { courseId, lectureId, content } */
  upsertNote: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user!.userId;
      const { courseId, lectureId, content } = req.body;

      const note = await StudentNote.findOneAndUpdate(
        { studentId, courseId, lectureId },
        { content: String(content || '') },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      res.json(successResponse(note));
    } catch (err) {
      next(err);
    }
  },
};
