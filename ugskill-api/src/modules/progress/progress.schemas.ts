import { z } from 'zod';

export const completeLectureSchema = z.object({
  params: z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    lectureId: z.string().min(1, 'Lecture ID is required'),
  }),
});

export const getProgressSummarySchema = z.object({
  params: z.object({
    courseId: z.string().min(1, 'Course ID is required'),
  }),
});
