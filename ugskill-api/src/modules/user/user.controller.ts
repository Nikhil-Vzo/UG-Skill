import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';
import { successResponse } from '../../lib/response';
import { parsePaginationQuery, buildPaginationMeta } from '../../lib/pagination';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getMe(req.user!.userId);
    res.status(200).json(successResponse(user));
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = Array.isArray(req.ip) ? req.ip[0] : req.ip;
    const user = await userService.updateMe(req.user!.userId, req.body, ip);
    res.status(200).json(successResponse(user));
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, perPage } = parsePaginationQuery(req.query);
    const filters = {
      role: req.query.role as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    };

    const { users, total } = await userService.listUsers(filters, page, perPage);
    const meta = buildPaginationMeta(total, page, perPage);

    res.status(200).json(successResponse(users, meta));
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUser(req.params.id as string);
    res.status(200).json(successResponse(user));
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = Array.isArray(req.ip) ? req.ip[0] : req.ip;
    const result = await userService.deleteUser(req.params.id as string, req.user!.userId, ip);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};
