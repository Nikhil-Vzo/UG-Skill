import { z } from 'zod';

export const createRoadmapSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(2000).optional(),
  goal_statement: z.string().max(500).optional(),
  target_role: z.string().max(100).optional(),
  is_restricted: z.boolean().default(false),
  difficulty: z.string().optional(),
  thumbnail_url: z.string().url().optional(),
});

export const updateRoadmapSchema = createRoadmapSchema.partial().extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const addRoadmapStageSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  courseIds: z.array(z.string()).optional(), // Mongo course IDs
});
