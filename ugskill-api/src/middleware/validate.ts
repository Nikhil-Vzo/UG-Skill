import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError, ZodRawShape } from 'zod';
import { logger } from '../lib/logger';

export const validate = (schema: ZodObject<ZodRawShape>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Replace with parsed/sanitized data
      req.body = parsed.body;
      Object.assign(req.query, parsed.query);
      Object.assign(req.params, parsed.params);
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.format(),
          },
        });
      } else {
        logger.error('Unexpected validation error', { error });
        next(error);
      }
    }
  };
};
