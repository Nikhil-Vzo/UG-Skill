import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request interface to include reqId
declare global {
  namespace Express {
    interface Request {
      reqId: string;
    }
  }
}

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.reqId = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-Id', req.reqId);
  next();
};
