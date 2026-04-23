import { Request, Response, NextFunction } from 'express';
import { roadmapService } from './roadmap.service';
import { createRoadmapSchema, updateRoadmapSchema, addRoadmapStageSchema } from './roadmap.schemas';
import { successResponse } from '../../lib/response';
import { z } from 'zod';

export const createRoadmap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createRoadmapSchema.parse(req.body);
    const roadmap = await roadmapService.createRoadmap(data, req.user!.userId);
    res.status(201).json(successResponse(roadmap));
  } catch (error) {
    next(error);
  }
};

export const getRoadmap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roadmap = await roadmapService.getRoadmap(req.params.id as string);
    res.status(200).json(successResponse(roadmap));
  } catch (error) {
    next(error);
  }
};

export const updateRoadmap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateRoadmapSchema.parse(req.body);
    const roadmap = await roadmapService.updateRoadmap(req.params.id as string, data);
    res.status(200).json(successResponse(roadmap));
  } catch (error) {
    next(error);
  }
};

export const deleteRoadmap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await roadmapService.deleteRoadmap(req.params.id as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = addRoadmapStageSchema.parse(req.body);
    const roadmap = await roadmapService.addStage(req.params.id as string, data);
    res.status(200).json(successResponse(roadmap));
  } catch (error) {
    next(error);
  }
};

export const searchRoadmaps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const querySchema = z.object({
      q: z.string().optional(),
      status: z.string().optional(),
      isRestricted: z.enum(['true', 'false']).optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
      targetRole: z.string().optional(),
    });
    const query = querySchema.parse(req.query);
    const roadmaps = await roadmapService.searchRoadmaps(query.q, {
      status: query.status,
      isRestricted: query.isRestricted,
      targetRole: query.targetRole,
    });
    res.status(200).json(successResponse(roadmaps, { total: roadmaps.length }));
  } catch (error) {
    next(error);
  }
};
