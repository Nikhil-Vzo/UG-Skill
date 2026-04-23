import { progressRepository } from './progress.repository';
import { courseRepo } from '../course/course.repository';
import { AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';

export class ProgressService {
  async markLectureComplete(studentId: string, courseId: string, lectureId: string) {
    // 1. Verify course and get total lectures count
    const course = await courseRepo.getCourseById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    
    // 2. Mark lecture complete
    const { alreadyCompleted } = await progressRepository.markLectureComplete(
      studentId, 
      courseId, 
      lectureId
    );

    let progress = await progressRepository.getProgressSummary(studentId, courseId);

    if (!alreadyCompleted) {
      // 3. Update Progress Summary only if not already completed
      const totalLectures = course.lecture_count || 0;
      progress = await progressRepository.upsertProgressSummary(
        studentId,
        courseId,
        totalLectures,
        lectureId
      );

      // 4. Update Streak Logic
      await this.updateStreak(studentId);
    }

    return {
      message: alreadyCompleted ? 'Lecture already completed' : 'Lecture marked complete',
      progress,
    };
  }

  async getProgressSummary(studentId: string, courseId: string) {
    const summary = await progressRepository.getProgressSummary(studentId, courseId);
    if (!summary) {
      return { courseId, lecturesCompleted: 0, totalLectures: 0, progressPercent: 0 };
    }

    const percent = (summary.totalLectures && summary.totalLectures > 0 && summary.lecturesCompleted)
      ? Math.round((summary.lecturesCompleted / summary.totalLectures) * 100)
      : 0;

    return {
      ...summary,
      progressPercent: percent
    };
  }

  async getStudentStreak(studentId: string) {
    const streak = await progressRepository.getStudentStreak(studentId);
    if (!streak) {
      return { currentStreak: 0, bestStreak: 0 };
    }
    return streak;
  }

  private async updateStreak(studentId: string) {
    const today = new Date();
    // Use UTC date string for simple daily boundaries
    const todayStr = today.toISOString().split('T')[0];

    const streak = await progressRepository.getStudentStreak(studentId);

    if (!streak) {
      // First time setting a streak
      await progressRepository.upsertStudentStreak(studentId, today);
      return;
    }

    if (!streak.lastActiveDate) {
      await progressRepository.updateStudentStreak(studentId, 1, Math.max(1, streak.bestStreak || 0), todayStr);
      return;
    }

    // Comparing YYYY-MM-DD string with today YYYY-MM-DD
    const lastActive = streak.lastActiveDate;
    if (lastActive === todayStr) {
      // Already active today, streak is unaffected
      return;
    }

    // Compute difference in days
    const todayDate = new Date(todayStr);
    const lastActiveDateObj = new Date(lastActive);
    const diffTime = Math.abs(todayDate.getTime() - lastActiveDateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let newCurrentStreak = streak.currentStreak || 0;
    if (diffDays === 1) {
      // Direct consecutive day
      newCurrentStreak += 1;
    } else if (diffDays > 1) {
      // Streak broken
      newCurrentStreak = 1;
      // Handle freezes here eventually 
    }

    const newBestStreak = Math.max(newCurrentStreak, streak.bestStreak || 0);

    await progressRepository.updateStudentStreak(studentId, newCurrentStreak, newBestStreak, todayStr);
    logger.info(`Streak updated for ${studentId}: current ${newCurrentStreak}, best ${newBestStreak}`);
  }
}

export const progressService = new ProgressService();
