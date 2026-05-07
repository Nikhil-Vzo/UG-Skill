import { z } from 'zod';

const frontendQuestionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['single_choice', 'multiple_choice', 'boolean']).optional(),
  text: z.string().min(1, 'Question text is required'),
  explanation: z.string().optional(),
  options: z.array(z.union([
    z.string(),
    z.object({
      id: z.string().optional(),
      text: z.string(),
      isCorrect: z.boolean().optional(),
    }),
  ])).min(2, 'At least 2 options required'),
  correct_answer: z.union([z.string(), z.array(z.string()), z.boolean()]).optional(),
  score_weight: z.number().optional(),
  isCorrect: z.boolean().optional(),
});

const backendQuestionSchema = z.object({
  type: z.enum(['single_choice', 'multiple_choice', 'boolean']).optional(),
  text: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).min(2, 'At least 2 options required'),
  correct_answer: z.union([z.string(), z.array(z.string()), z.boolean()]),
  score_weight: z.number().default(1),
});

export const createQuizDefinitionSchema = z.object({
  body: z.object({
    pg_course_id: z.string().optional(),
    title: z.string().min(1, 'Title is required'),
    attach_to: z.object({
      type: z.enum(['lecture', 'section', 'course']),
      id: z.string().min(1, 'Attachment ID is required'),
    }).optional(),
    config: z.object({
      time_limit_secs: z.number().optional(),
      max_attempts: z.number().default(3),
      pass_percentage: z.number().min(0).max(100).default(50),
    }).optional(),
    questions: z.array(z.union([frontendQuestionSchema, backendQuestionSchema])).min(1, 'At least 1 question is required'),
  }),
});

export const updateQuizDefinitionSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    config: z.object({
      time_limit_secs: z.number().optional(),
      max_attempts: z.number().optional(),
      pass_percentage: z.number().min(0).max(100).optional(),
    }).optional(),
    questions: z.array(z.union([frontendQuestionSchema, backendQuestionSchema])).optional(),
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
