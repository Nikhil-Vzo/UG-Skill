import { assignmentRepository } from './assignment.repository';
import { AppError } from '../../lib/errors';

export class AssignmentService {
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
