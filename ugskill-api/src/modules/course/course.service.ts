import { courseRepo } from './course.repository';
import { courseCatalogRepo } from './course-catalog.repository';
import { batchAccessRepo } from './batch-access.repository';
import { AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { events, APP_EVENTS } from '../../lib/events';
import { storage } from '../../lib/storage';

export class CourseService {
  private sanitizeStoragePath(url: string | undefined): string | undefined {
    if (!url || typeof url !== 'string') return url;
    if (!url.startsWith('http')) return url;

    try {
      // Handle Supabase signed URLs: /storage/v1/object/sign/bucket/path
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/');
      
      // Index 4 is usually 'sign' or 'authenticated' or 'public'
      // Index 5 is the bucket name
      if (parts.length > 6 && (parts[4] === 'sign' || parts[4] === 'authenticated' || parts[4] === 'public')) {
        return parts.slice(6).join('/');
      }
      return url;
    } catch (e) {
      return url;
    }
  }

  /**
   * Traverse course data and replace relative storage paths with signed download URLs.
   */
  async signCourseUrls(course: any) {
    if (!course) return course;
    
    // Convert to plain object if it's a Mongoose doc
    const data = course.toObject ? course.toObject() : { ...course };

    // 1. Sign thumbnail
    const thumbPath = data.thumbnail_url ?? data.thumbnailUrl;
    if (thumbPath && !thumbPath.startsWith('http')) {
      try {
        const { signedUrl } = await storage.getDownloadUrl(thumbPath);
        data.thumbnail_url = signedUrl;
        data.thumbnailUrl = signedUrl;
      } catch (err) {
        logger.warn(`Failed to sign thumbnail URL: ${thumbPath}`, err);
      }
    }

    // 2. Sign curriculum lectures
    const sections = data.sections ?? data.curriculum ?? [];
    if (Array.isArray(sections)) {
      for (const section of sections) {
        if (Array.isArray(section.lectures)) {
          for (const lecture of section.lectures) {
            // Sign video
            const videoPath = lecture.video_url ?? lecture.videoUrl;
            if (videoPath && !videoPath.startsWith('http')) {
              try {
                const { signedUrl } = await storage.getDownloadUrl(videoPath);
                lecture.video_url = signedUrl;
                lecture.videoUrl = signedUrl;
              } catch (err) {
                logger.warn(`Failed to sign video URL: ${videoPath}`, err);
              }
            }

            // Sign document
            const docPath = lecture.document_url ?? lecture.documentUrl;
            if (docPath && !docPath.startsWith('http')) {
              try {
                const { signedUrl } = await storage.getDownloadUrl(docPath);
                lecture.document_url = signedUrl;
                lecture.documentUrl = signedUrl;
              } catch (err) {
                logger.warn(`Failed to sign document URL: ${docPath}`, err);
              }
            }

            // Sign generic content_url
            if (lecture.content_url && !lecture.content_url.startsWith('http')) {
              try {
                const { signedUrl } = await storage.getDownloadUrl(lecture.content_url);
                lecture.content_url = signedUrl;
              } catch (err) {
                logger.warn(`Failed to sign content URL: ${lecture.content_url}`, err);
              }
            }
          }
        }
      }
    }
    
    return data;
  }

  async signCoursesUrls(courses: any[]) {
    return await Promise.all(courses.map(c => this.signCourseUrls(c)));
  }

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
    return await this.signCourseUrls(course);
  }

  async getLecture(courseId: string, lectureId: string) {
    const course = await this.getCourse(courseId);
    const sections = course.sections ?? [];

    for (const section of sections) {
      const lectures = Array.isArray(section.lectures) ? section.lectures : [];
      const lecture = lectures.find((item: any) => {
        const id = item._id?.toString?.() ?? item.id?.toString?.() ?? item._id ?? item.id;
        return String(id) === lectureId;
      });

      if (lecture) {
        return {
          courseId,
          courseTitle: course.title,
          sectionId: section._id?.toString?.() ?? section.id,
          sectionTitle: section.title,
          lecture,
        };
      }
    }

    throw new AppError('Lecture not found', 404);
  }

  private sanitizeCourseData(data: any) {
    if (!data) return;
    
    if (data.thumbnail_url) data.thumbnail_url = this.sanitizeStoragePath(data.thumbnail_url);
    if (data.thumbnailUrl) data.thumbnailUrl = this.sanitizeStoragePath(data.thumbnailUrl);
    
    const sections = data.sections ?? data.curriculum ?? [];
    if (Array.isArray(sections)) {
      for (const section of sections) {
        if (Array.isArray(section.lectures)) {
          for (const lecture of section.lectures) {
            if (lecture.video_url) lecture.video_url = this.sanitizeStoragePath(lecture.video_url);
            if (lecture.videoUrl) lecture.videoUrl = this.sanitizeStoragePath(lecture.videoUrl);
            if (lecture.document_url) lecture.document_url = this.sanitizeStoragePath(lecture.document_url);
            if (lecture.documentUrl) lecture.documentUrl = this.sanitizeStoragePath(lecture.documentUrl);
          }
        }
      }
    }
  }

  async updateCourse(id: string, data: any) {
    this.sanitizeCourseData(data);
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

    return await this.signCourseUrls(course);
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
    this.sanitizeCourseData(data);
    const course = await courseRepo.addSection(courseId, data);
    if (!course) throw new AppError('Course not found', 404);
    return await this.signCourseUrls(course);
  }

  async replaceSections(courseId: string, sections: any[]) {
    // Sanitize signed URLs from every lecture inside each section
    if (Array.isArray(sections)) {
      for (const section of sections) {
        if (Array.isArray(section.lectures)) {
          for (const lecture of section.lectures) {
            if (lecture.video_url)     lecture.video_url     = this.sanitizeStoragePath(lecture.video_url);
            if (lecture.videoUrl)      lecture.videoUrl      = this.sanitizeStoragePath(lecture.videoUrl);
            if (lecture.document_url)  lecture.document_url  = this.sanitizeStoragePath(lecture.document_url);
            if (lecture.documentUrl)   lecture.documentUrl   = this.sanitizeStoragePath(lecture.documentUrl);
            if (lecture.content_url)   lecture.content_url   = this.sanitizeStoragePath(lecture.content_url);
            if (lecture.transcript_url) lecture.transcript_url = this.sanitizeStoragePath(lecture.transcript_url);
          }
        }
        if (section.thumbnail_url) section.thumbnail_url = this.sanitizeStoragePath(section.thumbnail_url);
      }
    }

    // Use the repository which now issues explicit $set
    const course = await courseRepo.updateCourse(courseId, { sections } as any);
    if (!course) throw new AppError('Course not found', 404);
    return await this.signCourseUrls(course);
  }

  async addLecture(courseId: string, sectionIdx: number, data: any) {
    this.sanitizeCourseData({ lectures: [data] });
    const course = await courseRepo.addLectureToSection(courseId, sectionIdx, data);
    if (!course) throw new AppError('Course not found', 404);

    // Update lecture count + duration in PG catalog via CDC
    events.emit(APP_EVENTS.COURSE_UPDATED, {
      courseId,
      incrementLectures: 1,
      incrementDuration: data.duration_secs || 0,
    });

    return await this.signCourseUrls(course);
  }

  async searchCourses(query?: string, filters?: any) {
    // Query MongoDB directly — PG catalog is only populated via CDC/BullMQ
    // which requires a running background worker. MongoDB is always the source of truth.
    const courses = await courseRepo.searchCourses(query, filters);
    return await this.signCoursesUrls(courses);
  }

  async grantBatchAccess(courseId: string, batchId: string, grantedBy: string, expiresAt?: string) {
    return await batchAccessRepo.grantAccess(batchId, 'course', courseId, grantedBy, expiresAt);
  }
}

export const courseService = new CourseService();
