import { z } from 'zod';

export const createBatchSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Batch name must be at least 2 characters').max(100),
    institution: z.string().optional(),
    year: z.coerce.number().int().min(2000).max(2040).optional(),
    description: z.string().max(500).optional(),
    expiresAt: z.string().datetime().optional(),
  }),
});

export const updateBatchSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid batch ID'),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    institution: z.string().optional(),
    year: z.coerce.number().int().min(2000).max(2040).optional(),
    description: z.string().max(500).optional(),
    status: z.enum(['active', 'archived', 'expired']).optional(),
    expiresAt: z.string().datetime().optional(),
  }),
});

export const batchParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid batch ID'),
  }),
});

export const addMembersSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid batch ID'),
  }),
  body: z.object({
    userIds: z.array(z.string().uuid()).min(1, 'At least one user ID required'),
    role: z.enum(['student', 'mentor', 'admin']).default('student'),
  }),
});

export const removeMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid batch ID'),
    userId: z.string().uuid('Invalid user ID'),
  }),
});

export const grantCourseAccessSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid batch ID'),
  }),
  body: z.object({
    courseId: z.string(),
  }),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>['body'];
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>['body'];
export type AddMembersInput = z.infer<typeof addMembersSchema>['body'];
