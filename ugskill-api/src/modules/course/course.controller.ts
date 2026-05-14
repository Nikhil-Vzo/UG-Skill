import { Request, Response, NextFunction } from 'express';
import { courseService } from './course.service';
import { createCourseSchema, updateCourseSchema, createSectionSchema, createLectureSchema, batchAccessSchema } from './course.schemas';
import { successResponse } from '../../lib/response';
import { z } from 'zod';
import { verifyAccessToken } from '../../lib/jwt';
import { enrollmentRepo } from '../enrollment/enrollment.repository';

export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createCourseSchema.parse(req.body);
    const mappedData: any = { ...data };
    if ('subCategory' in data) { mappedData.sub_category = data.subCategory; delete mappedData.subCategory; }
    if ('thumbnailUrl' in data) { mappedData.thumbnail_url = data.thumbnailUrl; delete mappedData.thumbnailUrl; }
    if ('isFree' in data) { mappedData.is_free = data.isFree; delete mappedData.isFree; }

    const course = await courseService.createCourse(mappedData, req.user!.userId);
    res.status(201).json(successResponse(course));
  } catch (error) {
    next(error);
  }
};

export const getCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await courseService.getCourse(req.params.id as string);

    // Optionally attach isEnrolled for authenticated users.
    // GET /:id is a public route, so we silently peek at the token — no hard auth required.
    let isEnrolled = false;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);
        const enrollment = await enrollmentRepo.getEnrollment(
          decoded.userId,
          'course',
          req.params.id as string
        );
        isEnrolled = !!(enrollment && enrollment.status === 'active');
      }
    } catch {
      // Token absent or invalid — treat as unauthenticated, isEnrolled stays false
    }

    const courseData = course.toObject ? course.toObject() : { ...course };
    res.status(200).json(successResponse({ ...courseData, isEnrolled }));
  } catch (error) {
    next(error);
  }
};

export const getLecture = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lecture = await courseService.getLecture(
      req.params.courseId as string,
      req.params.lectureId as string
    );

    res.status(200).json(successResponse(lecture));
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateCourseSchema.parse(req.body);
    const mappedData: any = { ...data };
    if ('subCategory' in data) { mappedData.sub_category = data.subCategory; delete mappedData.subCategory; }
    if ('thumbnailUrl' in data) { mappedData.thumbnail_url = data.thumbnailUrl; delete mappedData.thumbnailUrl; }
    if ('isFree' in data) { mappedData.is_free = data.isFree; delete mappedData.isFree; }

    const course = await courseService.updateCourse(req.params.id as string, mappedData);
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
    const rawSections = req.body.sections || [];
    
    // Normalise lecture fields from CourseBuilder into expected DB format
    const normalisedSections = rawSections.map((section: any) => ({
      ...section,
      lectures: (section.lectures || []).map((lecture: any) => {
        // Map frontend "type" to database "content_type"
        let contentType = lecture.content_type || lecture.type || 'video';
        
        // Ensure "content_url" serves as primary, but keep specific URLs
        let contentUrl = lecture.content_url || lecture.video_url || lecture.document_url || lecture.external_url;
        
        return {
          ...lecture,
          content_type: contentType,
          type: contentType,
          content_url: contentUrl,
          video_url: lecture.video_url,
          document_url: lecture.document_url,
          external_url: lecture.external_url,
          content: lecture.content
        };
      })
    }));

    const course = await courseService.replaceSections(req.params.id as string, normalisedSections);
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
      search: z.string().optional(),
      status: z.string().optional(),
      category: z.string().optional(),
    });
    const query = querySchema.parse(req.query);
    const searchTerm = query.q || query.search;
    const courses = await courseService.searchCourses(searchTerm, {
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
