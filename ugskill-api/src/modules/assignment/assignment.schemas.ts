import { z } from 'zod';

export const submitAssignmentSchema = z.object({
  params: z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    assignmentId: z.string().min(1, 'Assignment ID is required'),
  }),
  body: z.object({
    fileUrls: z.array(z.string().url()).optional(),
    textContent: z.string().optional(),
  }).refine(data => data.fileUrls || data.textContent, {
    message: 'Either fileUrls or textContent must be provided',
  }),
});

export const gradeAssignmentSchema = z.object({
  params: z.object({
    submissionId: z.string().uuid('Valid UUID is required'),
  }),
  body: z.object({
    score: z.number().min(0),
    maxScore: z.number().min(0),
    feedback: z.string().optional(),
    status: z.enum(['submitted', 'graded', 'returned']).optional(),
  }),
});
