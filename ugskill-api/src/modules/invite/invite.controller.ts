import { Request, Response, NextFunction } from 'express';
import * as inviteService from './invite.service';
import { successResponse } from '../../lib/response';

// POST /admin/invites — admin generates invite for HR company
export const generateInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user.userId;
    const { email, role, companyName } = req.body;
    const result = await inviteService.generateInvite(adminId, email as string, role as any, companyName as string);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

// GET /auth/invite/:token — validate an invite token (no auth needed)
export const validateInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.params.token as string;
    const result = await inviteService.validateInviteToken(token);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

// POST /auth/invite/accept — set password and create account from invite
export const acceptInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, fullName, password } = req.body;
    const result = await inviteService.acceptInvite(
      token as string,
      fullName as string,
      password as string,
      req.ip,
      req.get('user-agent')
    );
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};
