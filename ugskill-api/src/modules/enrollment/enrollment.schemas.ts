import { z } from 'zod';

export const createEnrollmentSchema = z.object({
  enrollableType: z.enum(['course', 'roadmap']),
  enrollableId: z.string(), // Mongo ID as string
  source: z.string().default('self'),
  batchId: z.string().uuid().optional(),
});
