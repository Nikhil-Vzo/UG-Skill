import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: err.format(),
      },
    });
  }

  if (err instanceof AppError) {
    // Expected operational errors
    if (!err.isOperational || err.statusCode === 500) {
      logger.error('AppError (500 or not operational):', { error: err.message, stack: err.stack, details: err.details });
    }
    
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.name,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Fallback for unhandled/unexpected errors
  logger.error('Unhandled Error:', { error: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Something went wrong',
      detail: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    },
  });
};
