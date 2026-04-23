import { Request, Response, NextFunction } from 'express';
import { assignmentService } from './assignment.service';
import { successResponse } from '../../lib/response';

export class AssignmentController {
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const courseId = req.params.courseId as string;
      const assignmentId = req.params.assignmentId as string;

      const submission = await assignmentService.submitAssignment(
        studentId,
        courseId,
        assignmentId,
        req.body
      );

      res.status(201).json(successResponse('Assignment submitted successfully', submission));
    } catch (error) {
      next(error);
    }
  }

  async grade(req: Request, res: Response, next: NextFunction) {
    try {
      const graderId = req.user!.userId;
      const submissionId = req.params.submissionId as string;

      const graded = await assignmentService.gradeSubmission(
        submissionId,
        graderId,
        req.body
      );

      res.status(200).json(successResponse('Assignment graded successfully', graded));
    } catch (error) {
      next(error);
    }
  }
}

export const assignmentController = new AssignmentController();
