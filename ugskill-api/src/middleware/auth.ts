import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../lib/jwt';
import { logger } from '../lib/logger';
import { AuthError } from '../lib/errors';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AuthError('Token not found');
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    
    next();
  } catch (error: any) {
    logger.warn('Auth failed', { error: error.message, ip: req.ip });
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthError('User not authenticated');
      }

      const hasRole = req.user.roles.some((role) => 
        role === 'super_admin' || roles.includes(role)
      );
      if (!hasRole) {
        logger.warn('Forbidden access attempt', { userId: req.user.userId, requiredRoles: roles, actualRoles: req.user.roles });
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to access this resource',
          },
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
