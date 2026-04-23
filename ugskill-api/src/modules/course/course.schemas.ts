import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(2000).optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  difficulty: z.string().optional(),
  language: z.string().default('english'),
  thumbnailUrl: z.string().url().optional(),
  isFree: z.boolean().default(false),
  price: z.number().min(0).default(0),
  tags: z.array(z.string()).optional(),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
});

export const createSectionSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
});

export const createLectureSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  content_type: z.enum(['video', 'article', 'pdf', 'quiz']),
  content_url: z.string().url().optional(),
  duration_secs: z.number().min(0).optional(),
  is_preview: z.boolean().default(false),
});

export const batchAccessSchema = z.object({
  batchId: z.string().uuid(),
  expiresAt: z.string().datetime().optional(), // ISO string
});
