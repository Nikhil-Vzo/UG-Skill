import { z } from 'zod';

export const createReviewSchema = z.object({
  params: z.object({
    courseId: z.string().min(1, 'Course ID is required'),
  }),
  body: z.object({
    rating: z.number().int().min(1).max(5),
    reviewText: z.string().max(2000).optional(),
  }),
});

export const getReviewsSchema = z.object({
  params: z.object({
    courseId: z.string().min(1, 'Course ID is required'),
  }),
  query: z.object({
    limit: z.string().regex(/^\d+$/).optional(),
    offset: z.string().regex(/^\d+$/).optional(),
  }),
});
