import { assignmentRepository } from './assignment.repository';
import { courseRepo } from '../course/course.repository';
import { AppError } from '../../lib/errors';

export class AssignmentService {
  async getAssignmentDetails(courseId: string, assignmentId: string) {
    const course = await courseRepo.getCourseById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const sections = course.sections ?? [];
    let assignment: any = null;

    for (const section of sections) {
      const sectionAssignments = Array.isArray(section.assignments) ? section.assignments : [];
      assignment = sectionAssignments.find((item: any) => String(item._id ?? item.id ?? item.assignmentId) === assignmentId);
      if (assignment) break;

      const lectures = Array.isArray(section.lectures) ? section.lectures : [];
      for (const lecture of lectures) {
        const lectureAssignments = Array.isArray(lecture.assignments) ? lecture.assignments : [];
        assignment = lectureAssignments.find((item: any) => String(item._id ?? item.id ?? item.assignmentId) === assignmentId);
        if (assignment) break;
      }
      if (assignment) break;
    }

    return {
      id: assignmentId,
      courseId,
      course: course.title,
      title: assignment?.title ?? 'Course Assignment',
      dueDate: assignment?.dueDate ?? assignment?.due_date ?? 'TBD',
      maxFiles: assignment?.maxFiles ?? assignment?.max_files ?? 3,
      allowedTypes: assignment?.allowedTypes ?? assignment?.allowed_types ?? ['.zip', '.pdf', '.rar'],
      description: assignment?.description ?? 'Upload your completed assignment files for instructor review.',
    };
  }

  async submitAssignment(
    studentId: string,
    courseId: string,
    assignmentId: string,
    payload: { fileUrls?: string[]; textContent?: string }
  ) {
    // Optionally: check if enrollment exists and is valid before allowing submission
    // Optionally: check if assignment exists in Mongo Course Definition

    const submission = await assignmentRepository.saveSubmission({
      studentId,
      courseId,
      assignmentId,
      ...payload
    });

    return submission;
  }

  async gradeSubmission(
    submissionId: string,
    gradedBy: string,
    payload: { score: number; maxScore: number; feedback?: string; status?: string }
  ) {
    const existing = await assignmentRepository.getSubmissionById(submissionId);
    if (!existing) {
      throw new AppError('Submission not found', 404);
    }

    const graded = await assignmentRepository.gradeSubmission(submissionId, gradedBy, payload);

    return graded;
  }
}

export const assignmentService = new AssignmentService();
