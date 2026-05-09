import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
  inet,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { users, batches } from './core';

// --- EXAMS ---
export const exams = pgTable('exams', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  examType: text('exam_type'),
  mode: text('mode').default('scheduled'),
  status: text('status').default('draft'),
  creatorId: uuid('creator_id').notNull().references(() => users.id),
  totalMarks: numeric('total_marks', { precision: 8, scale: 2 }),
  durationMinutes: integer('duration_minutes').notNull(),
  passPercent: numeric('pass_percent', { precision: 5, scale: 2 }),
  negativeMarking: numeric('negative_marking', { precision: 4, scale: 3 }).default('0'),
  isProctored: boolean('is_proctored').default(false),
  shuffleQuestions: boolean('shuffle_questions').default(true),
  shuffleOptions: boolean('shuffle_options').default(true),
  instructions: text('instructions'),
  targetExamTags: text('target_exam_tags').array(),
  category: text('category'),
  difficulty: text('difficulty'),
  isPasswordProtected: boolean('is_password_protected').default(false),
  passwordHash: text('password_hash'),
  // Proctoring configuration
  gazeThreshold: integer('gaze_threshold').default(5),
  faceTimeoutSeconds: integer('face_timeout_seconds').default(10),
  allowMultipleFaces: boolean('allow_multiple_faces').default(false),
  autoTerminateScore: integer('auto_terminate_score').default(80),
  frameCaptureIntervalSec: integer('frame_capture_interval_sec').default(5),
  windowStart: timestamp('window_start', { withTimezone: true }),
  windowEnd: timestamp('window_end', { withTimezone: true }),
  mongoDefinitionId: text('mongo_definition_id'),
  templateId: uuid('template_id'), // self-reference, can't easily enforce at creation without extra step, letting it be a loose fk or explicit config later
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// --- EXAM BATCH ACCESS ---
export const examBatchAccess = pgTable('exam_batch_access', {
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  batchId: uuid('batch_id').notNull().references(() => batches.id),
  grantedBy: uuid('granted_by').references(() => users.id),
  grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.examId, table.batchId] }),
  };
});

// --- EXAM SECTIONS ---
export const examSections = pgTable('exam_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sectionOrder: integer('section_order').notNull(),
  timeLimitMinutes: integer('time_limit_minutes'),
  maxMarks: numeric('max_marks', { precision: 8, scale: 2 }),
  negativeMarking: numeric('negative_marking', { precision: 4, scale: 3 }),
  isLocked: boolean('is_locked').default(false),
  navigationMode: text('navigation_mode').default('free'),
  mongoPoolConfig: text('mongo_pool_config'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// --- EXAM ATTEMPTS ---
export const examAttempts = pgTable('exam_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => users.id),
  attemptNumber: integer('attempt_number').default(1).notNull(),
  status: text('status').default('in_progress'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  timeTakenSecs: integer('time_taken_secs'),
  ipAddress: inet('ip_address'),
  deviceFingerprint: text('device_fingerprint'),
  mongoResponsesId: text('mongo_responses_id'),
  proctoringVerdict: text('proctoring_verdict').default('pending'),
  violationCount: integer('violation_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// --- EXAM SCORES ---
export const examScores = pgTable('exam_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  attemptId: uuid('attempt_id').notNull().references(() => examAttempts.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => users.id),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  totalScore: numeric('total_score', { precision: 8, scale: 2 }).notNull(),
  maxScore: numeric('max_score', { precision: 8, scale: 2 }).notNull(),
  percentage: numeric('percentage', { precision: 5, scale: 2 }),
  passed: boolean('passed'),
  sectionScores: jsonb('section_scores'),
  topicScores: jsonb('topic_scores'),
  timeTakenSecs: integer('time_taken_secs'),
  computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow(),
});

// --- EXAM RANKINGS ---
export const examRankings = pgTable('exam_rankings', {
  id: uuid('id').primaryKey().defaultRandom(),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  batchId: uuid('batch_id').references(() => batches.id),
  studentId: uuid('student_id').notNull().references(() => users.id),
  rank: integer('rank').notNull(),
  percentile: numeric('percentile', { precision: 5, scale: 2 }),
  score: numeric('score', { precision: 8, scale: 2 }),
  computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow(),
});

// --- NOTIFICATION LOGS ---
export const notificationLogs = pgTable('notification_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  channel: text('channel').notNull(),
  type: text('type').notNull(),
  title: text('title'),
  body: text('body'),
  metadata: jsonb('metadata'),
  status: text('status').default('sent'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
});
