import { Request, Response, NextFunction } from 'express';
import { quizService } from './quiz.service';
import { successResponse } from '../../lib/response';

export class QuizController {
  async createDefinition(req: Request, res: Response, next: NextFunction) {
    try {
      const creatorId = req.user!.userId;
      const quizDef = await quizService.createDefinition(creatorId, req.body);
      
      res.status(201).json(successResponse('Quiz definition created', quizDef));
    } catch (error) {
      next(error);
    }
  }

  async submitAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const quizId = req.params.quizId as string;
      const { courseId, timeTakenSecs, responses } = req.body;

      const result = await quizService.submitAttempt(
        studentId,
        quizId,
        courseId,
        timeTakenSecs,
        responses
      );

      res.status(200).json(successResponse('Quiz attempt submitted successfully', result));
    } catch (error) {
      next(error);
    }
  }
}

export const quizController = new QuizController();
