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
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) Object.assign(req.query, parsed.query);
      if (parsed.params !== undefined) Object.assign(req.params, parsed.params);
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        const message = firstError ? firstError.message : 'Invalid input data';
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: message,
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
