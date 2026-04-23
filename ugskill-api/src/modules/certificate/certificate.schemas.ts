import { z } from 'zod';

export const generateCertificateSchema = z.object({
  body: z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    courseTitle: z.string().min(1, 'Course Title is required'),
  }),
});

export const verifyCertificateSchema = z.object({
  params: z.object({
    verificationUuid: z.string().uuid('Valid Verification UUID is required'),
  }),
});
