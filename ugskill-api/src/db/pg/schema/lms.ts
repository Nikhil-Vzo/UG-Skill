import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  smallint,
  date,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { users, batches } from './core';

// --- COURSE CATALOG ---
export const courseCatalog = pgTable('course_catalog', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  creatorId: uuid('creator_id').references(() => users.id),
  category: text('category'),
  subCategory: text('sub_category'),
  difficulty: text('difficulty'),
  language: text('language').default('english'),
  thumbnailUrl: text('thumbnail_url'),
  isFree: boolean('is_free').default(false),
  price: numeric('price', { precision: 10, scale: 2 }).default('0'),
  status: text('status').default('draft'),
  avgRating: numeric('avg_rating', { precision: 3, scale: 2 }),
  totalRatings: integer('total_ratings').default(0),
  enrollmentCount: integer('enrollment_count').default(0),
  lectureCount: integer('lecture_count').default(0),
  totalDurationSecs: integer('total_duration_secs').default(0),
  tags: text('tags').array(),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- ROADMAP CATALOG ---
export const roadmapCatalog = pgTable('roadmap_catalog', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  creatorId: uuid('creator_id').references(() => users.id),
  targetRole: text('target_role'),
  difficulty: text('difficulty'),
  thumbnailUrl: text('thumbnail_url'),
  status: text('status').default('draft'),
  stageCount: integer('stage_count').default(0),
  courseCount: integer('course_count').default(0),
  isRestricted: boolean('is_restricted').default(false),
  enrollmentCount: integer('enrollment_count').default(0),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- ENROLLMENTS ---
export const enrollments = pgTable('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => users.id),
  enrollableType: text('enrollable_type').notNull(),
  enrollableId: text('enrollable_id').notNull(),
  status: text('status').default('active'),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  progressPercent: numeric('progress_percent', { precision: 5, scale: 2 }).default('0'),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  source: text('source').default('self'),
  batchId: uuid('batch_id').references(() => batches.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- LECTURE COMPLETIONS ---
export const lectureCompletions = pgTable('lecture_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => users.id),
  lectureId: text('lecture_id').notNull(),
  courseId: text('course_id').notNull(),
  enrollmentId: uuid('enrollment_id').references(() => enrollments.id),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow(),
  watchTimeSecs: integer('watch_time_secs').default(0),
});

// --- QUIZ ATTEMPTS ---
export const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => users.id),
  quizId: text('quiz_id').notNull(),
  courseId: text('course_id').notNull(),
  attemptNumber: integer('attempt_number').notNull(),
  score: numeric('score', { precision: 5, scale: 2 }).notNull(),
  maxScore: numeric('max_score', { precision: 5, scale: 2 }).notNull(),
  passed: boolean('passed').notNull(),
  timeTakenSecs: integer('time_taken_secs'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// --- ASSIGNMENT SUBMISSIONS ---
export const assignmentSubmissions = pgTable('assignment_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => users.id),
  assignmentId: text('assignment_id').notNull(),
  courseId: text('course_id').notNull(),
  fileUrls: text('file_urls').array(),
  textContent: text('text_content'),
  attemptNumber: integer('attempt_number').default(1),
  status: text('status').default('submitted'),
  score: numeric('score', { precision: 5, scale: 2 }),
  maxScore: numeric('max_score', { precision: 5, scale: 2 }),
  gradedBy: uuid('graded_by').references(() => users.id),
  gradedAt: timestamp('graded_at', { withTimezone: true }),
  feedback: text('feedback'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- COURSE REVIEWS ---
export const courseReviews = pgTable('course_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => users.id),
  courseId: text('course_id').notNull(),
  rating: smallint('rating').notNull(),
  reviewText: text('review_text'),
  helpfulCount: integer('helpful_count').default(0),
  status: text('status').default('published'),
  moderatedAt: timestamp('moderated_at', { withTimezone: true }),
  moderatedBy: uuid('moderated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- CERTIFICATES ---
export const certificates = pgTable('certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => users.id),
  certType: text('cert_type').notNull(),
  referenceId: text('reference_id').notNull(),
  referenceTitle: text('reference_title').notNull(),
  verificationUuid: uuid('verification_uuid').defaultRandom().unique(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow(),
  pdfUrl: text('pdf_url'),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

// --- STUDENT STREAKS ---
export const studentStreaks = pgTable('student_streaks', {
  studentId: uuid('student_id').primaryKey().references(() => users.id),
  currentStreak: integer('current_streak').default(0),
  bestStreak: integer('best_streak').default(0),
  lastActiveDate: date('last_active_date'),
  freezeCredits: integer('freeze_credits').default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- PROGRESS SUMMARY ---
export const progressSummary = pgTable('progress_summary', {
  studentId: uuid('student_id').notNull().references(() => users.id),
  courseId: text('course_id').notNull(),
  lecturesCompleted: integer('lectures_completed').default(0),
  totalLectures: integer('total_lectures').default(0),
  totalWatchSecs: integer('total_watch_secs').default(0),
  lastLectureId: text('last_lecture_id'),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  recomputedAt: timestamp('recomputed_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.studentId, table.courseId] }),
  };
});

// --- BATCH COURSE ACCESS ---
export const batchCourseAccess = pgTable('batch_course_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').notNull().references(() => batches.id),
  contentType: text('content_type').notNull(),
  contentId: text('content_id').notNull(),
  grantedBy: uuid('granted_by').references(() => users.id),
  grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});
