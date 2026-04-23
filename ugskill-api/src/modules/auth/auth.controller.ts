import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { successResponse } from '../../lib/response';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body, req.ip);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body, req.ip, req.get('user-agent'));
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.status(200).json(successResponse({ message: 'Logged out successfully' }));
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.refreshTokens(
      req.body.refreshToken,
      req.ip,
      req.get('user-agent')
    );
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.forgotPassword(req.body.email);
    // Always return success to prevent email enumeration
    res.status(200).json(successResponse({ message: 'If the email exists, a reset link has been sent.' }));
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    res.status(200).json(successResponse({ message: 'Password has been reset.' }));
  } catch (error) {
    next(error);
  }
};
