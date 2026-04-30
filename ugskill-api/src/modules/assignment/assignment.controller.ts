import { Request, Response, NextFunction } from 'express';
import { assignmentService } from './assignment.service';
import { successResponse } from '../../lib/response';

export class AssignmentController {
  async getDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.courseId as string;
      const assignmentId = req.params.assignmentId as string;

      const assignment = await assignmentService.getAssignmentDetails(courseId, assignmentId);

      res.status(200).json(successResponse(assignment));
    } catch (error) {
      next(error);
    }
  }

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

      res.status(201).json(successResponse(submission, { message: 'Assignment submitted successfully' }));
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

      res.status(200).json(successResponse(graded, { message: 'Assignment graded successfully' }));
    } catch (error) {
      next(error);
    }
  }
}

export const assignmentController = new AssignmentController();
