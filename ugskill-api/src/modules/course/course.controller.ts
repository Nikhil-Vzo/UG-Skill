import { Request, Response, NextFunction } from 'express';
import { courseService } from './course.service';
import { createCourseSchema, updateCourseSchema, createSectionSchema, createLectureSchema, batchAccessSchema } from './course.schemas';
import { successResponse } from '../../lib/response';
import { z } from 'zod';

export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createCourseSchema.parse(req.body);
    const course = await courseService.createCourse(data, req.user!.userId);
    res.status(201).json(successResponse(course));
  } catch (error) {
    next(error);
  }
};

export const getCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await courseService.getCourse(req.params.id as string);
    res.status(200).json(successResponse(course));
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateCourseSchema.parse(req.body);
    const course = await courseService.updateCourse(req.params.id as string, data);
    res.status(200).json(successResponse(course));
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await courseService.deleteCourse(req.params.id as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSectionSchema.parse(req.body);
    const course = await courseService.addSection(req.params.id as string, data);
    res.status(200).json(successResponse(course));
  } catch (error) {
    next(error);
  }
};

export const replaceSections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await courseService.replaceSections(req.params.id as string, req.body.sections);
    res.status(200).json(successResponse(course));
  } catch (error) {
    next(error);
  }
};

export const addLecture = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createLectureSchema.parse(req.body);
    const sectionIdx = parseInt(req.params.sectionIdx as string, 10);
    if (isNaN(sectionIdx) || sectionIdx < 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid section index' } });
    }
    const course = await courseService.addLecture(req.params.id as string, sectionIdx, data);
    res.status(200).json(successResponse(course));
  } catch (error) {
    next(error);
  }
};

export const searchCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const querySchema = z.object({
      q: z.string().optional(),
      status: z.string().optional(),
      category: z.string().optional(),
    });
    const query = querySchema.parse(req.query);
    const courses = await courseService.searchCourses(query.q, {
      status: query.status,
      category: query.category,
    });
    res.status(200).json(successResponse(courses, { total: courses.length }));
  } catch (error) {
    next(error);
  }
};

export const grantBatchAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = batchAccessSchema.parse(req.body);
    const access = await courseService.grantBatchAccess(
      req.params.id as string,
      data.batchId,
      req.user!.userId,
      data.expiresAt
    );
    res.status(201).json(successResponse(access));
  } catch (error) {
    next(error);
  }
};
