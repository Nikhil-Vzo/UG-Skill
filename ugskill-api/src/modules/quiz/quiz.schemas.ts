import { z } from 'zod';

export const createQuizDefinitionSchema = z.object({
  body: z.object({
    pg_course_id: z.string().min(1, 'Course ID is required'),
    title: z.string().min(1, 'Title is required'),
    attach_to: z.object({
      type: z.enum(['lecture', 'section', 'course']),
      id: z.string().min(1, 'Attachment ID is required'), // Maps to mongoose ObjectId
    }),
    config: z.object({
      time_limit_secs: z.number().optional(),
      max_attempts: z.number().default(3),
      pass_percentage: z.number().min(0).max(100).default(50),
    }).optional(),
    questions: z.array(
      z.object({
        type: z.enum(['single_choice', 'multiple_choice', 'boolean']),
        text: z.string().min(1, 'Question text is required'),
        options: z.array(z.string()).min(2, 'At least 2 options required'),
        correct_answer: z.union([z.string(), z.array(z.string()), z.boolean()]),
        score_weight: z.number().default(1),
      })
    ).min(1, 'At least 1 question is required'),
  }),
});

export const submitQuizAttemptSchema = z.object({
  params: z.object({
    quizId: z.string().min(1, 'Quiz ID is required'),
  }),
  body: z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    timeTakenSecs: z.number().min(0),
    responses: z.array(
      z.object({
        questionIdx: z.number(),
        answer: z.union([z.string(), z.array(z.string()), z.boolean()]),
      })
    ),
  }),
});
