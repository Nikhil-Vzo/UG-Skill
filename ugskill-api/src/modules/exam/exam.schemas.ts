import { z } from 'zod';

// --- EXAM SCHEMAS ---
export const createExamSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    examType: z.enum(['practice', 'mock', 'live', 'assessment', 'competitive']).nullable().optional(),
    mode: z.enum(['scheduled', 'anytime']).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    totalMarks: z.number().optional(),
    durationMinutes: z.number().int().min(1),
    passPercent: z.number().min(0).max(100).optional(),
    negativeMarking: z.number().min(0).optional(),
    isProctored: z.boolean().optional(),
    shuffleQuestions: z.boolean().optional(),
    shuffleOptions: z.boolean().optional(),
    instructions: z.string().optional(),
    targetExamTags: z.array(z.string()).optional(),
    category: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'very_hard']).optional(),
    isPasswordProtected: z.boolean().optional(),
    passwordHash: z.string().optional(),
    windowStart: z.string().datetime().optional(),
    windowEnd: z.string().datetime().optional(),
    mongoDefinition: z.object({
      sections: z.array(z.any()).optional(),
      template_notes: z.string().optional(),
    }).optional()
  })
});

export const updateExamSchema = z.object({
  body: createExamSchema.shape.body.partial()
});

export const examQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: z.string().optional(),
    category: z.string().optional(),
    difficulty: z.string().optional(),
    mode: z.string().optional()
  })
});

export const createSectionSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    name: z.string().min(1),
    sectionOrder: z.number().int(),
    timeLimitMinutes: z.number().int().optional(),
    maxMarks: z.number().optional(),
    negativeMarking: z.number().optional(),
    isLocked: z.boolean().optional(),
    navigationMode: z.enum(['free', 'sequential', 'locked_after_submit']).optional(),
    mongoPoolConfig: z.any().optional()
  })
});

export const replaceSectionsSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    sections: z.array(z.object({
      name: z.string().min(1),
      sectionOrder: z.number().int().optional(),
      timeLimitMinutes: z.number().int().optional(),
      maxMarks: z.number().optional(),
      negativeMarking: z.number().optional(),
      isLocked: z.boolean().optional(),
      navigationMode: z.enum(['free', 'sequential', 'locked_after_submit']).optional(),
      mongoPoolConfig: z.any().optional()
    })).min(1)
  })
});

export const grantBatchAccessSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    batchId: z.string().uuid()
  })
});

// --- EXAM QUESTION SCHEMAS ---
export const createQuestionSchema = z.object({
  body: z.object({
    type: z.string(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    stem: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'very_hard']).optional(),
    subject: z.string().optional(),
    topic: z.string().optional(),
    tags: z.array(z.string()).optional(),
    source_type: z.string().optional(),
    source_exam: z.string().optional(),
    source_year: z.number().int().optional(),
    bloom_level: z.string().optional(),
    estimated_time_secs: z.number().int().optional(),
    marks: z.number().optional(),
    negative_marks: z.number().optional(),
    media_attachments: z.array(z.any()).optional(),
    options: z.array(z.any()).optional(),
    explanation: z.string().optional(),
  })
});

export const updateQuestionSchema = z.object({
  body: createQuestionSchema.shape.body.partial()
});

export const questionQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    type: z.string().optional(),
    difficulty: z.string().optional(),
    status: z.string().optional(),
    subject: z.string().optional(),
    topic: z.string().optional(),
    tags: z.string().optional(), // Can match a single tag
  })
});

// --- ATTEMPT SCHEMAS ---
export const startAttemptSchema = z.object({
  params: z.object({
    id: z.string().uuid() // examId
  }),
  body: z.object({
    ipAddress: z.string().optional(),
    deviceFingerprint: z.string().optional()
  }).optional().default({})
});

// Save answers incrementally during an attempt
export const saveIncrementalResponseSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    attemptId: z.string().uuid()
  }),
  body: z.object({
    responses: z.array(z.any()).optional(),
    questionId: z.string().optional(),
    selectedOption: z.any().optional()
  }).optional().default({})
});

export const submitAttemptSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    attemptId: z.string().uuid()
  }),
  body: z.object({
    timeTakenSecs: z.number().int().optional(),
    responses: z.array(z.any()).optional()
  }).optional().default({})
});

export const attemptQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    examId: z.string().uuid().optional(),
    studentId: z.string().uuid().optional(),
    status: z.string().optional()
  })
});

export const resultQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    examId: z.string().uuid().optional(),
    studentId: z.string().uuid().optional()
  })
});

// --- PROCTORING SCHEMAS ---
export const ingestExamProctoringEventSchema = z.object({
  body: z.object({
    session_id: z.string().uuid(),
    event_type: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    confidence: z.number().optional(),
    evidence_snapshot_url: z.string().url().optional(),
    timestamp: z.string().datetime().optional(), // Defaults to now if skipped
    metadata: z.any().optional()
  })
});

export const examProctoringEventQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    studentId: z.string().uuid().optional(),
    sessionId: z.string().uuid().optional(),
    eventType: z.string().optional(),
    severity: z.string().optional()
  })
});

// Types Export
export type CreateExamInput = z.infer<typeof createExamSchema>['body'];
export type UpdateExamInput = z.infer<typeof updateExamSchema>['body'];
export type CreateSectionInput = z.infer<typeof createSectionSchema>['body'];
export type ReplaceSectionsInput = z.infer<typeof replaceSectionsSchema>['body'];
export type GrantBatchAccessInput = z.infer<typeof grantBatchAccessSchema>['body'];
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>['body'];
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>['body'];
export type StartAttemptInput = z.infer<typeof startAttemptSchema>['body'];
export type SaveIncrementalResponseInput = z.infer<typeof saveIncrementalResponseSchema>['body'];
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>['body'];
export type IngestExamProctoringEventInput = z.infer<typeof ingestExamProctoringEventSchema>['body'];
