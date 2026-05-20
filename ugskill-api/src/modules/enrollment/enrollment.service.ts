import { enrollmentRepo } from './enrollment.repository';
import { courseRepo } from '../course/course.repository';
import { roadmapRepo } from '../roadmap/roadmap.repository';
import { AppError } from '../../lib/errors';

export class EnrollmentService {
  async enroll(studentId: string, data: any) {
    const { enrollableType, enrollableId } = data;

    // Check if item exists and is published
    if (enrollableType === 'course') {
      const course = await courseRepo.getCourseById(enrollableId);
      if (!course) throw new AppError('Course not found', 404);
      if (course.status !== 'published') throw new AppError('Course cannot be enrolled in at this time', 400);
    } else if (enrollableType === 'roadmap') {
      const roadmap = await roadmapRepo.getRoadmapById(enrollableId);
      if (!roadmap) throw new AppError('Roadmap not found', 404);
      if (roadmap.status !== 'published') throw new AppError('Roadmap cannot be enrolled in at this time', 400);
    }

    // Check if already enrolled
    const existing = await enrollmentRepo.getEnrollment(studentId, enrollableType, enrollableId);
    if (existing) {
      throw new AppError('Already enrolled', 400);
    }

    // Enroll
    return await enrollmentRepo.enrollStudent({
      studentId,
      enrollableType,
      enrollableId,
      source: data.source,
      batchId: data.batchId,
    });
  }

  async getMyEnrollments(studentId: string) {
    const allEnrollments = await enrollmentRepo.getStudentEnrollments(studentId);
    
    // Separate course and roadmap enrollments
    const courseEnrollments = allEnrollments.filter(e => e.enrollableType === 'course');
    const roadmapEnrollments = allEnrollments.filter(e => e.enrollableType === 'roadmap');
    
    let validCourseIds: string[] = [];
    if (courseEnrollments.length > 0) {
      const courseIds = courseEnrollments.map(e => e.enrollableId);
      const existingCourses = await courseRepo.getCoursesByIds(courseIds);
      validCourseIds = existingCourses.map(c => c._id.toString());
    }

    let validRoadmapIds: string[] = [];
    if (roadmapEnrollments.length > 0) {
      const roadmapIds = roadmapEnrollments.map(e => e.enrollableId);
      const existingRoadmaps = await roadmapRepo.getRoadmapsByIds(roadmapIds);
      validRoadmapIds = existingRoadmaps.map(r => r._id.toString());
    }

    return allEnrollments.filter(e => {
      if (e.enrollableType === 'course') {
        return validCourseIds.includes(e.enrollableId);
      }
      if (e.enrollableType === 'roadmap') {
        return validRoadmapIds.includes(e.enrollableId);
      }
      return false;
    });
  }

  async checkAccess(studentId: string, enrollableType: string, enrollableId: string, userBatches?: string[]) {
    // 1. Check direct enrollment
    const enrollment = await enrollmentRepo.getEnrollment(studentId, enrollableType, enrollableId);
    if (enrollment && enrollment.status === 'active') {
      if (enrollment.expiresAt && enrollment.expiresAt < new Date()) {
        return { hasAccess: false, reason: 'Enrollment expired' };
      }
      return { hasAccess: true, type: 'direct' };
    }

    // 2. Check batch access
    if (userBatches && userBatches.length > 0) {
      for (const batchId of userBatches) {
        const hasBatchAccess = await enrollmentRepo.checkBatchAccess(batchId, enrollableType, enrollableId);
        if (hasBatchAccess) {
          return { hasAccess: true, type: 'batch' };
        }
      }
    }

    return { hasAccess: false, reason: 'No active enrollment or batch access' };
  }
}

export const enrollmentService = new EnrollmentService();
