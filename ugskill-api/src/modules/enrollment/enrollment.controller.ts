import { Request, Response, NextFunction } from 'express';
import { enrollmentService } from './enrollment.service';
import { createEnrollmentSchema } from './enrollment.schemas';
import { successResponse } from '../../lib/response';
import { z } from 'zod';

export const enroll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createEnrollmentSchema.parse(req.body);
    const enrollment = await enrollmentService.enroll(req.user!.userId, data);
    res.status(201).json(successResponse(enrollment));
  } catch (error) {
    next(error);
  }
};

export const getMyEnrollments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enrollments = await enrollmentService.getMyEnrollments(req.user!.userId);
    res.status(200).json(successResponse(enrollments, { total: enrollments.length }));
  } catch (error) {
    next(error);
  }
};

export const checkAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const paramsSchema = z.object({
      type: z.enum(['course', 'roadmap']),
      id: z.string(),
    });
    const { type, id } = paramsSchema.parse(req.params);

    const status = await enrollmentService.checkAccess(req.user!.userId, type, id, []);
    res.status(200).json(successResponse(status));
  } catch (error) {
    next(error);
  }
};
