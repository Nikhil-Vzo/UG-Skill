import { z } from 'zod';

// Company Schemas
export const createCompanySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required').max(100),
    logoUrl: z.string().url().optional(),
    industry: z.string().optional(),
    tier: z.enum(['tier_1', 'tier_2', 'tier_3', 'startup', 'mnc']).optional(),
    difficultyLevel: z.enum(['easy', 'medium', 'hard']).optional(),
    websiteUrl: z.string().url().optional(),
    description: z.string().optional(),
    ctcRangeLpa: z.tuple([z.number(), z.number()]).optional(), // Represents numrange
    // MongoDB specific rich profile data
    richBio: z.string().optional(),
    officeLocations: z.array(z.string()).optional(),
    perks: z.array(z.string()).optional(),
    interviewProcess: z.array(z.object({
      stage: z.string(),
      description: z.string()
    })).optional()
  })
});

export const updateCompanySchema = z.object({
  body: createCompanySchema.shape.body.partial()
});

export const companyQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    industry: z.string().optional(),
    tier: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional()
  })
});

// Drive Schemas
export const eligibilitySchema = z.object({
  cgpaCutoff: z.number().min(0).max(10).optional(),
  allowedDegrees: z.array(z.string()).optional(),
  allowedBranches: z.array(z.string()).optional(),
  activeBacklogsAllowed: z.number().int().min(0).optional(),
  skillsRequired: z.array(z.string()).optional()
});

export const createDriveSchema = z.object({
  body: z.object({
    companyId: z.string().uuid(),
    name: z.string().min(5, 'Drive name must be at least 5 characters'),
    targetRoles: z.array(z.string()).min(1, 'At least one target role is required'),
    eligibility: eligibilitySchema.optional(),
    batchIds: z.array(z.string().uuid()).optional(),
    scheduledAt: z.string().datetime().optional(),
    registrationDeadline: z.string().datetime().optional(),
    // MongoDB specific interview flow data
    flowSpec: z.array(z.object({
      roundNumber: z.number().int().min(1),
      roundType: z.enum(['resume_shortlist', 'online_assessment', 'technical_interview', 'hr_interview', 'group_discussion']),
      description: z.string().optional(),
      passingScore: z.number().optional()
    })).min(1, 'At least one interview round is required')
  })
});

export const updateDriveSchema = z.object({
  body: createDriveSchema.shape.body.partial().omit({ companyId: true }) // Prevent changing the company of an existing drive
});

export const driveQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    companyId: z.string().uuid().optional(),
    status: z.enum(['upcoming', 'active', 'completed', 'cancelled']).optional(),
    userId: z.string().uuid().optional()
  })
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>['body'];
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>['body'];
export type CompanyQuery = z.infer<typeof companyQuerySchema>['query'];

export type CreateDriveInput = z.infer<typeof createDriveSchema>['body'];
export type UpdateDriveInput = z.infer<typeof updateDriveSchema>['body'];
export type DriveQuery = z.infer<typeof driveQuerySchema>['query'];

// --- DRIVE REGISTRATION SCHEMAS ---
export const registerForDriveSchema = z.object({
  body: z.object({
    driveId: z.string().uuid()
  })
});

export const updateRegistrationSchema = z.object({
  body: z.object({
    status: z.enum(['registered', 'shortlisted', 'interview', 'rejected', 'selected']).optional(),
    eligibilityOk: z.boolean().optional()
  })
});

export const registrationQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    driveId: z.string().uuid().optional(),
    studentId: z.string().uuid().optional(),
    status: z.string().optional()
  })
});

export type RegisterForDriveInput = z.infer<typeof registerForDriveSchema>['body'];
export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>['body'];
export type RegistrationQuery = z.infer<typeof registrationQuerySchema>['query'];

// --- QUESTION BANK SCHEMAS ---
export const createQuestionSchema = z.object({
  body: z.object({
    type: z.enum(['aptitude', 'coding', 'technical', 'hr', 'gd_topic']),
    status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'very_hard']).optional(),
    subject: z.string().optional(),
    topic: z.string().optional(),
    tags: z.array(z.string()).optional(),
    company_tags: z.array(z.string()).optional(),
    source: z.any().optional(),
    bloom_level: z.string().optional(),
    estimated_solve_secs: z.number().int().optional(),
    stem: z.string().optional()
  }).passthrough()
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
    topic: z.string().optional()
  })
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>['body'];
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>['body'];
export type QuestionQuery = z.infer<typeof questionQuerySchema>['query'];

// --- INTERVIEW FLOW SCHEMAS ---
export const createInterviewFlowSchema = z.object({
  body: z.object({
    pg_company_id: z.string().uuid(),
    name: z.string().min(3),
    target_roles: z.array(z.string()).optional(),
    status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
    dependency_mode: z.string().optional(),
    rounds: z.array(z.any()).optional(),
    active_version_pinned: z.boolean().optional()
  })
});

export const updateInterviewFlowSchema = z.object({
  body: createInterviewFlowSchema.shape.body.partial().omit({ pg_company_id: true })
});

export const interviewFlowQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    pg_company_id: z.string().uuid().optional(),
    status: z.string().optional()
  })
});

export type CreateInterviewFlowInput = z.infer<typeof createInterviewFlowSchema>['body'];
export type UpdateInterviewFlowInput = z.infer<typeof updateInterviewFlowSchema>['body'];
export type InterviewFlowQuery = z.infer<typeof interviewFlowQuerySchema>['query'];

// --- PLACEMENT SESSION SCHEMAS ---
export const createPlacementSessionSchema = z.object({
  body: z.object({
    studentId: z.string().uuid(),
    sessionType: z.enum(['live_interview', 'mock_interview', 'group_discussion']),
    driveId: z.string().uuid().optional(),
    companyId: z.string().uuid().optional(),
    mongoFlowId: z.string().optional(),
    roundNumber: z.number().int().optional()
  })
});

export const updatePlacementSessionStatusSchema = z.object({
  body: z.object({
    status: z.enum(['scheduled', 'in_progress', 'completed', 'passed', 'failed', 'cancelled']),
    score: z.number().optional(),
    maxScore: z.number().optional(),
    percentile: z.number().optional(),
    mongoAttemptId: z.string().optional(),
    recordingUrl: z.string().url().optional(),
    proctoringVerdict: z.string().optional(),
    startedAt: z.string().datetime().optional(),
    endedAt: z.string().datetime().optional()
  })
});

export const placementSessionQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    studentId: z.union([z.string().uuid(), z.literal('me')]).optional(),
    driveId: z.string().uuid().optional(),
    companyId: z.string().uuid().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    active: z.union([z.literal('true'), z.literal('false')]).optional(),
    sessionType: z.enum(['live_interview', 'mock_interview', 'group_discussion']).optional()
  })
});

export type CreatePlacementSessionInput = z.infer<typeof createPlacementSessionSchema>['body'];
export type UpdatePlacementSessionStatusInput = z.infer<typeof updatePlacementSessionStatusSchema>['body'];
export type PlacementSessionQuery = z.infer<typeof placementSessionQuerySchema>['query'];

// --- MOCK INTERVIEW ATTEMPTS (5.7) ---
export const createMockAttemptSchema = z.object({
  body: z.object({
    pg_session_id: z.string().uuid(),
    pg_student_id: z.string().uuid(),
    pg_company_id: z.string().uuid().optional(),
    flow_id: z.string().optional(),
    round_number: z.number().int().optional(),
    session_type: z.string().optional()
  })
});

export const updateMockAttemptSchema = z.object({
  body: z.object({
    status: z.string().optional(),
    responses: z.array(z.any()).optional(),
    aggregate_scores: z.any().optional(),
    proctoring_flags: z.array(z.any()).optional(),
    recording_url: z.string().url().optional(),
    transcript_url: z.string().url().optional()
  })
});

export const mockAttemptQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    pg_student_id: z.string().uuid().optional(),
    pg_session_id: z.string().uuid().optional(),
    status: z.string().optional()
  })
});

export type CreateMockAttemptInput = z.infer<typeof createMockAttemptSchema>['body'];
export type UpdateMockAttemptInput = z.infer<typeof updateMockAttemptSchema>['body'];
export type MockAttemptQuery = z.infer<typeof mockAttemptQuerySchema>['query'];

// --- GD SESSIONS (5.8) ---
export const createGDSessionSchema = z.object({
  body: z.object({
    driveId: z.string().uuid().optional(),
    topic: z.string().min(3),
    scheduledAt: z.string().datetime(),
    durationMinutes: z.number().int().optional(),
    groupSizeLimit: z.number().int().optional()
  })
});

export const updateGDSessionSchema = z.object({
  body: z.object({
    topic: z.string().optional(),
    scheduledAt: z.string().datetime().optional(),
    status: z.string().optional(),
    mongoRecordingId: z.string().optional()
  })
});

export const gdSessionQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    driveId: z.string().uuid().optional(),
    status: z.string().optional()
  })
});

export const addGDParticipantSchema = z.object({
  body: z.object({
    studentId: z.string().uuid()
  })
});

export const updateGDParticipantSchema = z.object({
  body: z.object({
    contributionScore: z.number().optional(),
    aiScoreBreakdown: z.any().optional(),
    evaluatorScore: z.number().optional(),
    evaluatorNotes: z.string().optional(),
    joinedAt: z.string().datetime().optional(),
    leftAt: z.string().datetime().optional()
  })
});

// ==========================================
// 5.9 - LIVE INTERVIEW SLOTS / BOOKINGS
// ==========================================

export const createLiveInterviewSlotSchema = z.object({
  body: z.object({
    driveId: z.string().uuid(),
    interviewerIds: z.array(z.string().uuid()).optional(),
    scheduledAt: z.string().datetime(),
    durationMinutes: z.number().int().optional(),
  })
});

export const updateLiveInterviewSlotSchema = z.object({
  body: z.object({
    interviewerIds: z.array(z.string().uuid()).optional(),
    scheduledAt: z.string().datetime().optional(),
    durationMinutes: z.number().int().optional(),
    status: z.enum(['available', 'booked', 'completed', 'cancelled']).optional()
  })
});

export const liveSlotQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    driveId: z.string().uuid().optional(),
    status: z.string().optional()
  })
});

export const bookLiveInterviewSchema = z.object({
  body: z.object({
    slotId: z.string().uuid()
  })
});

export const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.enum(['confirmed', 'completed', 'no_show', 'cancelled'])
  })
});

// ==========================================
// 5.10 - PEER GROUPS
// ==========================================

export const createPeerGroupSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    maxMembers: z.number().int().min(2).optional(),
    isPrivate: z.boolean().optional()
  })
});

export const updatePeerGroupSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    maxMembers: z.number().int().min(2).optional(),
    isPrivate: z.boolean().optional()
  })
});

export const peerGroupQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    userId: z.string().uuid().optional(), // For finding groups user is part of
    isPrivate: z.string().transform((v) => v === 'true').optional()
  })
});

export const addPeerGroupMemberSchema = z.object({
  body: z.object({
    userId: z.string().uuid()
  })
});

export const createPeerSessionSchema = z.object({
  body: z.object({
    groupId: z.string().uuid().optional(), // if undefined, perhaps 1-1 random pairing
    sessionType: z.string(),
    mongoQuestionSet: z.string().optional(),
    scheduledAt: z.string().datetime().optional()
  })
});

export const updatePeerSessionSchema = z.object({
  body: z.object({
    status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).optional()
  })
});

// ==========================================
// 5.11 - READINESS SCORES
// ==========================================

export const readinessScoreQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    studentId: z.string().uuid().optional(),
    companyId: z.string().uuid().optional(),
  })
});

export type CreateGDSessionInput = z.infer<typeof createGDSessionSchema>['body'];
export type UpdateGDSessionInput = z.infer<typeof updateGDSessionSchema>['body'];
export type GDSessionQuery = z.infer<typeof gdSessionQuerySchema>['query'];
export type AddGDParticipantInput = z.infer<typeof addGDParticipantSchema>['body'];
export type UpdateGDParticipantInput = z.infer<typeof updateGDParticipantSchema>['body'];

export type CreateLiveSlotInput = z.infer<typeof createLiveInterviewSlotSchema>['body'];
export type UpdateLiveSlotInput = z.infer<typeof updateLiveInterviewSlotSchema>['body'];
export type LiveSlotQuery = z.infer<typeof liveSlotQuerySchema>['query'];
export type BookLiveInterviewInput = z.infer<typeof bookLiveInterviewSchema>['body'];
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>['body'];

export type CreatePeerGroupInput = z.infer<typeof createPeerGroupSchema>['body'];
export type UpdatePeerGroupInput = z.infer<typeof updatePeerGroupSchema>['body'];
export type PeerGroupQuery = z.infer<typeof peerGroupQuerySchema>['query'];
export type AddPeerGroupMemberInput = z.infer<typeof addPeerGroupMemberSchema>['body'];

export type CreatePeerSessionInput = z.infer<typeof createPeerSessionSchema>['body'];
export type UpdatePeerSessionInput = z.infer<typeof updatePeerSessionSchema>['body'];

export type ReadinessScoreQuery = z.infer<typeof readinessScoreQuerySchema>['query'];

// --- PROCTORING EVENTS (5.12) ---
export const ingestProctoringEventSchema = z.object({
  body: z.object({
    session_type: z.string(),
    pg_session_id: z.string().uuid().optional(),
    event_type: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    timestamp: z.string().datetime().optional(), // Default to now if not provided
    metadata: z.any().optional()
  })
});

export const proctoringEventQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    studentId: z.string().uuid().optional(),
    sessionId: z.string().uuid().optional(),
    eventType: z.string().optional(),
    severity: z.string().optional()
  })
});

export type IngestProctoringEventInput = z.infer<typeof ingestProctoringEventSchema>['body'];
export type ProctoringEventQuery = z.infer<typeof proctoringEventQuerySchema>['query'];
