import { Request, Response, NextFunction } from 'express';
import * as batchService from './batch.service';
import { successResponse } from '../../lib/response';
import { parsePaginationQuery, buildPaginationMeta } from '../../lib/pagination';

const getIp = (req: Request): string | undefined => {
  return Array.isArray(req.ip) ? req.ip[0] : req.ip;
};

export const createBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batch = await batchService.createBatch(req.body, req.user!.userId, getIp(req));
    res.status(201).json(successResponse(batch));
  } catch (error) {
    next(error);
  }
};

export const getBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batch = await batchService.getBatch(req.params.id as string);
    res.status(200).json(successResponse(batch));
  } catch (error) {
    next(error);
  }
};

export const listBatches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, perPage } = parsePaginationQuery(req.query);
    const { data, total } = await batchService.listBatches(page, perPage);
    const meta = buildPaginationMeta(total, page, perPage);

    res.status(200).json(successResponse(data, meta));
  } catch (error) {
    next(error);
  }
};

export const updateBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batch = await batchService.updateBatch(req.params.id as string, req.body, req.user!.userId, getIp(req));
    res.status(200).json(successResponse(batch));
  } catch (error) {
    next(error);
  }
};

export const deleteBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await batchService.deleteBatch(req.params.id as string, req.user!.userId, getIp(req));
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const addMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await batchService.addMembers(req.params.id as string, req.body, req.user!.userId, getIp(req));
    res.status(201).json(successResponse(members));
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await batchService.removeMember(req.params.id as string, req.params.userId as string, req.user!.userId, getIp(req));
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const grantCourseAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await batchService.grantCourseAccess(
      req.params.id as string,
      req.body.courseId,
      req.user!.userId,
      getIp(req)
    );
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const revokeCourseAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await batchService.revokeCourseAccess(
      req.params.id as string,
      req.params.courseId as string,
      req.user!.userId,
      getIp(req)
    );
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};
