import { Request, Response, NextFunction } from 'express';
import { quizService } from './quiz.service';
import { successResponse } from '../../lib/response';

export class QuizController {
  async createDefinition(req: Request, res: Response, next: NextFunction) {
    try {
      const creatorId = req.user!.userId;
      const quizDef = await quizService.createDefinition(creatorId, req.body);
      
      res.status(201).json(successResponse(quizDef, { message: 'Quiz definition created' }));
    } catch (error) {
      next(error);
    }
  }

  async getDefinition(req: Request, res: Response, next: NextFunction) {
    try {
      const quizId = req.params.quizId as string;
      const quiz = await quizService.getDefinition(quizId);
      res.status(200).json(successResponse(quiz));
    } catch (error) {
      next(error);
    }
  }

  async updateDefinition(req: Request, res: Response, next: NextFunction) {
    try {
      const quizId = req.params.quizId as string;
      const quiz = await quizService.updateDefinition(quizId, req.body);
      res.status(200).json(successResponse(quiz, { message: 'Quiz updated' }));
    } catch (error) {
      next(error);
    }
  }

  async listDefinitions(req: Request, res: Response, next: NextFunction) {
    try {
      const quizzes = await quizService.listDefinitions(req.query);
      res.status(200).json(successResponse(quizzes, { total: quizzes.length }));
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

      res.status(200).json(successResponse(result, { message: 'Quiz attempt submitted successfully' }));
    } catch (error) {
      next(error);
    }
  }
}

export const quizController = new QuizController();
