import { z } from 'zod';

export const updateMeSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    institution: z.string().optional(),
    branch: z.string().optional(),
    cgpa: z.coerce.number().min(0).max(10).optional(),
    graduationYear: z.coerce.number().int().min(2000).max(2040).optional(),
    resumeUrl: z.string().optional(),
    resumeData: z.any().optional(),
  }),
});

export const getUserParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});

export const updateUserRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    roles: z.array(z.enum(['student', 'admin', 'super_admin', 'creator', 'hr', 'placement_coordinator', 'expert'])),
  }),
});

export const suspendUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    reason: z.string().min(5).max(500),
  }),
});


export const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    perPage: z.string().optional(),
    role: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
  }),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>['body'];
