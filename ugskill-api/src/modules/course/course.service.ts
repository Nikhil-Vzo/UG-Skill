import { courseRepo } from './course.repository';
import { courseCatalogRepo } from './course-catalog.repository';
import { batchAccessRepo } from './batch-access.repository';
import { AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { events, APP_EVENTS } from '../../lib/events';

export class CourseService {
  async createCourse(data: any, creatorId: string) {
    // 1. Create in Mongo
    const mongoData = {
      ...data,
      pg_creator_id: creatorId,
      status: data.status || 'draft',
    };
    const course = await courseRepo.createCourse(mongoData);

    // 2. Async Sync to Postgres via BullMQ and CDC
    events.emit(APP_EVENTS.COURSE_CREATED, {
      courseId: course._id.toString(),
        title: course.title,
        description: data.description,
        creatorId: creatorId,
        category: course.category,
        subCategory: course.sub_category,
        difficulty: course.difficulty,
        language: course.language,
        isFree: course.is_free,
        price: course.price?.toString(),
        tags: course.tags,
        status: course.status,
    });

    return course;
  }

  async getCourse(id: string) {
    const course = await courseRepo.getCourseById(id);
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    return course;
  }

  async updateCourse(id: string, data: any) {
    const course = await courseRepo.updateCourse(id, data);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Sync to Postgres via CDC
    events.emit(APP_EVENTS.COURSE_UPDATED, {
      courseId: course._id.toString(),
        title: course.title,
        category: course.category,
        subCategory: course.sub_category,
        difficulty: course.difficulty,
        language: course.language,
        isFree: course.is_free,
        price: course.price?.toString(),
        status: course.status,
    });

    return course;
  }

  async deleteCourse(id: string) {
    await courseCatalogRepo.deleteCatalog(id);
    const result = await courseRepo.deleteCourse(id);
    if (!result) {
      throw new AppError('Course not found', 404);
    }
    return { success: true };
  }

  async addSection(courseId: string, data: any) {
    const course = await courseRepo.addSection(courseId, data);
    if (!course) throw new AppError('Course not found', 404);
    return course;
  }

  async replaceSections(courseId: string, sections: any[]) {
    const course = await courseRepo.updateCourse(courseId, { sections });
    if (!course) throw new AppError('Course not found', 404);
    return course;
  }

  async addLecture(courseId: string, sectionIdx: number, data: any) {
    const course = await courseRepo.addLectureToSection(courseId, sectionIdx, data);
    if (!course) throw new AppError('Course not found', 404);

    // Update lecture count + duration in PG catalog via CDC
    events.emit(APP_EVENTS.COURSE_UPDATED, {
      courseId,
      incrementLectures: 1,
      incrementDuration: data.duration_secs || 0,
    });

    return course;
  }

  async searchCourses(query?: string, filters?: any) {
    // Query MongoDB directly — PG catalog is only populated via CDC/BullMQ
    // which requires a running background worker. MongoDB is always the source of truth.
    return await courseRepo.searchCourses(query, filters);
  }

  async grantBatchAccess(courseId: string, batchId: string, grantedBy: string, expiresAt?: string) {
    return await batchAccessRepo.grantAccess(batchId, 'course', courseId, grantedBy, expiresAt);
  }
}

export const courseService = new CourseService();
