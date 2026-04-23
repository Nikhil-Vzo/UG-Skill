import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
  customType,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { users } from './core';

// Custom type for PostgreSQL numrange
const numrange = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'numrange';
  },
});

// --- COMPANIES ---
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  industry: text('industry'),
  tier: text('tier'),
  difficultyLevel: text('difficulty_level'),
  websiteUrl: text('website_url'),
  description: text('description'),
  ctcRangeLpa: numrange('ctc_range_lpa'),
  mongoProfileId: text('mongo_profile_id'),
  status: text('status').default('active'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// --- COMPANY DRIVES ---
export const companyDrives = pgTable('company_drives', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  name: text('name').notNull(),
  targetRoles: text('target_roles').array(),
  eligibility: jsonb('eligibility'),
  batchIds: uuid('batch_ids').array(),
  mongoFlowId: text('mongo_flow_id'),
  status: text('status').default('upcoming'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  registrationDeadline: timestamp('registration_deadline', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- DRIVE REGISTRATIONS ---
export const driveRegistrations = pgTable('drive_registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  driveId: uuid('drive_id').notNull().references(() => companyDrives.id),
  studentId: uuid('student_id').notNull().references(() => users.id),
  eligibilityOk: boolean('eligibility_ok').default(false),
  status: text('status').default('registered'),
  registeredAt: timestamp('registered_at', { withTimezone: true }).defaultNow(),
});

// --- PLACEMENT SESSIONS ---
export const placementSessions = pgTable('placement_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => users.id),
  sessionType: text('session_type').notNull(),
  driveId: uuid('drive_id').references(() => companyDrives.id),
  companyId: uuid('company_id').references(() => companies.id),
  mongoFlowId: text('mongo_flow_id'),
  roundNumber: integer('round_number'),
  status: text('status').default('scheduled'),
  score: numeric('score', { precision: 5, scale: 2 }),
  maxScore: numeric('max_score', { precision: 5, scale: 2 }),
  percentile: numeric('percentile', { precision: 5, scale: 2 }),
  mongoAttemptId: text('mongo_attempt_id'),
  recordingUrl: text('recording_url'),
  proctoringVerdict: text('proctoring_verdict'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- READINESS SCORES ---
export const readinessScores = pgTable('readiness_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => users.id),
  companyId: uuid('company_id').references(() => companies.id),
  overallScore: numeric('overall_score', { precision: 5, scale: 2 }).notNull(),
  components: jsonb('components'),
  sessionsCount: integer('sessions_count').default(0),
  computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow(),
});

// --- GD SESSIONS ---
export const gdSessions = pgTable('gd_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  driveId: uuid('drive_id').references(() => companyDrives.id),
  topic: text('topic').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').default(30),
  groupSizeLimit: integer('group_size_limit').default(8),
  status: text('status').default('scheduled'),
  mongoRecordingId: text('mongo_recording_id'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- GD PARTICIPANTS ---
export const gdParticipants = pgTable('gd_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  gdSessionId: uuid('gd_session_id').notNull().references(() => gdSessions.id),
  studentId: uuid('student_id').notNull().references(() => users.id),
  contributionScore: numeric('contribution_score', { precision: 5, scale: 2 }),
  aiScoreBreakdown: jsonb('ai_score_breakdown'),
  evaluatorScore: numeric('evaluator_score', { precision: 5, scale: 2 }),
  evaluatorNotes: text('evaluator_notes'),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  leftAt: timestamp('left_at', { withTimezone: true }),
});

// --- LIVE INTERVIEW SLOTS ---
export const liveInterviewSlots = pgTable('live_interview_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  driveId: uuid('drive_id').notNull().references(() => companyDrives.id),
  interviewerIds: uuid('interviewer_ids').array(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').default(45),
  status: text('status').default('available'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});


// --- LIVE INTERVIEW BOOKINGS ---
export const liveInterviewBookings = pgTable('live_interview_bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  slotId: uuid('slot_id').notNull().references(() => liveInterviewSlots.id),
  studentId: uuid('student_id').notNull().references(() => users.id),
  status: text('status').default('confirmed'),
  sessionId: uuid('session_id').references(() => placementSessions.id),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }).defaultNow(),
});

// --- PEER GROUPS ---
export const peerGroups = pgTable('peer_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  createdBy: uuid('created_by').references(() => users.id),
  maxMembers: integer('max_members').default(10),
  isPrivate: boolean('is_private').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});


// --- PEER GROUP MEMBERS ---
export const peerGroupMembers = pgTable('peer_group_members', {
  groupId: uuid('group_id').notNull().references(() => peerGroups.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.groupId, table.userId] }),
  };
});

// --- PEER SESSIONS ---
export const peerSessions = pgTable('peer_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => peerGroups.id),
  sessionType: text('session_type'),
  mongoQuestionSet: text('mongo_question_set'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  status: text('status').default('scheduled'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
