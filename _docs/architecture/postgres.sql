-- ============================================================
-- UGSkill Platform — PostgreSQL Schema (Source of Truth)
-- Hybrid Architecture: PostgreSQL + MongoDB
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- EXTENSION SETUP
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─────────────────────────────────────────────────────────────
-- UTILITY: updated_at trigger
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;


-- ╔══════════════════════════════════════════════════════════╗
-- ║  MODULE 0 — CORE / IDENTITY                             ║
-- ╚══════════════════════════════════════════════════════════╝

CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT NOT NULL UNIQUE,
  email_verified      BOOLEAN DEFAULT FALSE,
  password_hash       TEXT,
  full_name           TEXT NOT NULL,
  avatar_url          TEXT,
  phone               TEXT,

  -- Multi-role array: student | creator | admin | hr | proctor
  roles               TEXT[] DEFAULT ARRAY['student']::TEXT[],

  -- Academic profile
  institution         TEXT,
  branch              TEXT,
  cgpa                NUMERIC(4,2),
  graduation_year     INTEGER,

  -- Account state
  status              TEXT DEFAULT 'active'
                        CHECK (status IN ('active', 'suspended', 'disabled')),
  suspension_reason   TEXT,
  last_login_at       TIMESTAMPTZ,
  login_count         INTEGER DEFAULT 0,

  -- OAuth
  oauth_provider      TEXT,
  oauth_provider_id   TEXT,

  -- Soft delete + timestamps
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_users_email          ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_roles          ON users USING gin(roles);
CREATE INDEX idx_users_institution    ON users(institution) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE user_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,
  ip_address      INET,
  user_agent      TEXT,
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sessions_user ON user_sessions(user_id, expires_at);


CREATE TABLE batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  institution     TEXT,
  year            INTEGER,
  description     TEXT,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'expired')),
  created_by      UUID REFERENCES users(id),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE TRIGGER trg_batches_updated_at BEFORE UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE batch_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            TEXT DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'admin')),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  removed_at      TIMESTAMPTZ,
  UNIQUE (batch_id, user_id)
);
CREATE INDEX idx_batch_members_user  ON batch_members(user_id);
CREATE INDEX idx_batch_members_batch ON batch_members(batch_id) WHERE removed_at IS NULL;


-- Audit log — immutable, partitioned by month
CREATE TABLE audit_logs (
  id          UUID DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- (continue for each month)

CREATE INDEX idx_audit_actor  ON audit_logs(actor_id, created_at);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);


-- ╔══════════════════════════════════════════════════════════╗
-- ║  MODULE 1 — LMS                                         ║
-- ╚══════════════════════════════════════════════════════════╝

-- Materialized catalog from MongoDB courses
CREATE TABLE course_catalog (
  id                  TEXT PRIMARY KEY,            -- MongoDB ObjectId as TEXT
  title               TEXT NOT NULL,
  description         TEXT,
  creator_id          UUID REFERENCES users(id),
  category            TEXT,
  sub_category        TEXT,
  difficulty          TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  language            TEXT DEFAULT 'english',
  thumbnail_url       TEXT,
  is_free             BOOLEAN DEFAULT FALSE,
  price               NUMERIC(10,2) DEFAULT 0,
  status              TEXT DEFAULT 'draft'
                        CHECK (status IN ('draft', 'review', 'published', 'archived')),
  avg_rating          NUMERIC(3,2),
  total_ratings       INTEGER DEFAULT 0,
  enrollment_count    INTEGER DEFAULT 0,
  lecture_count       INTEGER DEFAULT 0,
  total_duration_secs INTEGER DEFAULT 0,
  tags                TEXT[],
  synced_at           TIMESTAMPTZ DEFAULT NOW(),   -- last synced from MongoDB
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_catalog_creator    ON course_catalog(creator_id);
CREATE INDEX idx_catalog_status     ON course_catalog(status);
CREATE INDEX idx_catalog_tags       ON course_catalog USING gin(tags);
CREATE INDEX idx_catalog_search     ON course_catalog USING gin(to_tsvector('english', title || ' ' || COALESCE(description,'')));


-- Roadmap catalog (also materialized from MongoDB)
CREATE TABLE roadmap_catalog (
  id                  TEXT PRIMARY KEY,            -- MongoDB ObjectId
  title               TEXT NOT NULL,
  description         TEXT,
  creator_id          UUID REFERENCES users(id),
  target_role         TEXT,
  difficulty          TEXT,
  thumbnail_url       TEXT,
  status              TEXT DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published', 'archived')),
  stage_count         INTEGER DEFAULT 0,
  course_count        INTEGER DEFAULT 0,
  is_restricted       BOOLEAN DEFAULT FALSE,
  enrollment_count    INTEGER DEFAULT 0,
  synced_at           TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_roadmap_creator ON roadmap_catalog(creator_id);


-- Enrollments — transactional source of truth
CREATE TABLE enrollments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES users(id),
  enrollable_type     TEXT NOT NULL CHECK (enrollable_type IN ('course', 'roadmap')),
  enrollable_id       TEXT NOT NULL,               -- MongoDB ObjectId
  status              TEXT DEFAULT 'active'
                        CHECK (status IN ('active', 'completed', 'dropped', 'expired')),
  enrolled_at         TIMESTAMPTZ DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  progress_percent    NUMERIC(5,2) DEFAULT 0,
  last_activity_at    TIMESTAMPTZ,
  source              TEXT DEFAULT 'self'
                        CHECK (source IN ('self', 'batch_assign', 'roadmap_auto', 'admin')),
  batch_id            UUID REFERENCES batches(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, enrollable_type, enrollable_id)
);
CREATE INDEX idx_enrollments_student    ON enrollments(student_id, status);
CREATE INDEX idx_enrollments_enrollable ON enrollments(enrollable_type, enrollable_id);
CREATE INDEX idx_enrollments_batch      ON enrollments(batch_id) WHERE batch_id IS NOT NULL;
CREATE TRIGGER trg_enrollments_updated_at BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Lecture completion log
CREATE TABLE lecture_completions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES users(id),
  lecture_id      TEXT NOT NULL,                   -- MongoDB ObjectId
  course_id       TEXT NOT NULL,                   -- MongoDB ObjectId
  enrollment_id   UUID REFERENCES enrollments(id),
  completed_at    TIMESTAMPTZ DEFAULT NOW(),
  watch_time_secs INTEGER DEFAULT 0,
  UNIQUE (student_id, lecture_id)
);
CREATE INDEX idx_lecture_comp_student ON lecture_completions(student_id, course_id);
CREATE INDEX idx_lecture_comp_course  ON lecture_completions(course_id);


-- Quiz attempts summary (detail in MongoDB)
CREATE TABLE quiz_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES users(id),
  quiz_id         TEXT NOT NULL,                   -- MongoDB ObjectId
  course_id       TEXT NOT NULL,                   -- MongoDB ObjectId
  attempt_number  INTEGER NOT NULL,
  score           NUMERIC(5,2) NOT NULL,
  max_score       NUMERIC(5,2) NOT NULL,
  passed          BOOLEAN NOT NULL,
  time_taken_secs INTEGER,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, quiz_id, attempt_number)
);
CREATE INDEX idx_quiz_attempts_student ON quiz_attempts(student_id, quiz_id);
CREATE INDEX idx_quiz_attempts_course  ON quiz_attempts(course_id);


-- Assignment submissions
CREATE TABLE assignment_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES users(id),
  assignment_id   TEXT NOT NULL,                   -- MongoDB ObjectId
  course_id       TEXT NOT NULL,                   -- MongoDB ObjectId
  file_urls       TEXT[],
  text_content    TEXT,
  attempt_number  INTEGER DEFAULT 1,
  status          TEXT DEFAULT 'submitted'
                    CHECK (status IN ('submitted', 'graded', 'resubmission_required')),
  score           NUMERIC(5,2),
  max_score       NUMERIC(5,2),
  graded_by       UUID REFERENCES users(id),
  graded_at       TIMESTAMPTZ,
  feedback        TEXT,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_assignment_sub_student    ON assignment_submissions(student_id);
CREATE INDEX idx_assignment_sub_assignment ON assignment_submissions(assignment_id);


-- Course reviews
CREATE TABLE course_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES users(id),
  course_id       TEXT NOT NULL,
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text     TEXT,
  helpful_count   INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'published'
                    CHECK (status IN ('published', 'flagged', 'removed')),
  moderated_at    TIMESTAMPTZ,
  moderated_by    UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, course_id)
);
CREATE INDEX idx_reviews_course ON course_reviews(course_id, status);


-- Certificates (LMS + Exam)
CREATE TABLE certificates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES users(id),
  cert_type           TEXT NOT NULL
                        CHECK (cert_type IN ('course', 'roadmap', 'exam', 'skill_mastery')),
  reference_id        TEXT NOT NULL,               -- course/roadmap/exam id
  reference_title     TEXT NOT NULL,
  verification_uuid   UUID DEFAULT gen_random_uuid() UNIQUE,
  issued_at           TIMESTAMPTZ DEFAULT NOW(),
  pdf_url             TEXT,
  revoked_at          TIMESTAMPTZ
);
CREATE INDEX idx_certs_student ON certificates(student_id, cert_type);
CREATE UNIQUE INDEX idx_certs_ref ON certificates(student_id, cert_type, reference_id);


-- Streaks & engagement
CREATE TABLE student_streaks (
  student_id          UUID PRIMARY KEY REFERENCES users(id),
  current_streak      INTEGER DEFAULT 0,
  best_streak         INTEGER DEFAULT 0,
  last_active_date    DATE,
  freeze_credits      INTEGER DEFAULT 0,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);


-- Progress summary (materialized from MongoDB activity events)
CREATE TABLE progress_summary (
  student_id          UUID NOT NULL REFERENCES users(id),
  course_id           TEXT NOT NULL,
  lectures_completed  INTEGER DEFAULT 0,
  total_lectures      INTEGER DEFAULT 0,
  total_watch_secs    INTEGER DEFAULT 0,
  last_lecture_id     TEXT,
  last_accessed_at    TIMESTAMPTZ,
  recomputed_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, course_id)
);
CREATE INDEX idx_progress_summary_course ON progress_summary(course_id);


-- Batch-course access control
CREATE TABLE batch_course_access (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id    UUID NOT NULL REFERENCES batches(id),
  content_type TEXT NOT NULL CHECK (content_type IN ('course', 'roadmap')),
  content_id   TEXT NOT NULL,
  granted_by  UUID REFERENCES users(id),
  granted_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  UNIQUE (batch_id, content_type, content_id)
);


-- ╔══════════════════════════════════════════════════════════╗
-- ║  MODULE 2 — PLACEMENT                                   ║
-- ╚══════════════════════════════════════════════════════════╝

CREATE TABLE companies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  logo_url            TEXT,
  industry            TEXT,
  tier                TEXT CHECK (tier IN ('tier1', 'tier2', 'tier3', 'startup', 'mass_recruiter')),
  difficulty_level    TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'very_hard')),
  website_url         TEXT,
  description         TEXT,
  ctc_range_lpa       NUMRANGE,                    -- e.g., numrange(6, 12)
  mongo_profile_id    TEXT,                        -- MongoDB company_profiles ObjectId
  status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_tier     ON companies(tier);
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Company drives (recruitment campaigns)
CREATE TABLE company_drives (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id),
  name                TEXT NOT NULL,
  target_roles        TEXT[],
  eligibility         JSONB,                       -- {min_cgpa, branches[], graduation_years[]}
  batch_ids           UUID[],
  mongo_flow_id       TEXT,                        -- MongoDB interview_flows ObjectId
  status              TEXT DEFAULT 'upcoming'
                        CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  scheduled_at        TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_drives_company ON company_drives(company_id, status);
CREATE TRIGGER trg_drives_updated_at BEFORE UPDATE ON company_drives
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Drive registrations
CREATE TABLE drive_registrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id        UUID NOT NULL REFERENCES company_drives(id),
  student_id      UUID NOT NULL REFERENCES users(id),
  eligibility_ok  BOOLEAN DEFAULT FALSE,
  status          TEXT DEFAULT 'registered'
                    CHECK (status IN ('registered', 'shortlisted', 'rejected', 'placed', 'withdrawn')),
  registered_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (drive_id, student_id)
);
CREATE INDEX idx_drive_reg_student ON drive_registrations(student_id, status);
CREATE INDEX idx_drive_reg_drive   ON drive_registrations(drive_id, status);


-- Placement sessions (mock interviews, GD, live, tests)
CREATE TABLE placement_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES users(id),
  session_type        TEXT NOT NULL
                        CHECK (session_type IN (
                          'aptitude_test', 'coding_test', 'technical_test',
                          'mock_interview', 'live_interview', 'gd_session', 'peer_practice'
                        )),
  drive_id            UUID REFERENCES company_drives(id),
  company_id          UUID REFERENCES companies(id),
  mongo_flow_id       TEXT,                        -- MongoDB interview_flows ObjectId
  round_number        INTEGER,
  status              TEXT DEFAULT 'scheduled'
                        CHECK (status IN ('scheduled', 'in_progress', 'completed', 'abandoned', 'disqualified')),
  score               NUMERIC(5,2),
  max_score           NUMERIC(5,2),
  percentile          NUMERIC(5,2),
  mongo_attempt_id    TEXT,                        -- MongoDB mock_interview_attempts ObjectId
  recording_url       TEXT,
  proctoring_verdict  TEXT CHECK (proctoring_verdict IN ('clean', 'flagged', 'disqualified')),
  started_at          TIMESTAMPTZ,
  ended_at            TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_psessions_student ON placement_sessions(student_id, session_type);
CREATE INDEX idx_psessions_drive   ON placement_sessions(drive_id) WHERE drive_id IS NOT NULL;
CREATE TRIGGER trg_psessions_updated_at BEFORE UPDATE ON placement_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Interview readiness scores (computed from MongoDB raw data)
CREATE TABLE readiness_scores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES users(id),
  company_id          UUID REFERENCES companies(id),           -- NULL = overall readiness
  overall_score       NUMERIC(5,2) NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  components          JSONB,                                   -- {aptitude: 72, coding: 85, technical: 68, communication: 79, hr: 91}
  sessions_count      INTEGER DEFAULT 0,
  computed_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, company_id)
);
CREATE INDEX idx_readiness_student ON readiness_scores(student_id);
CREATE INDEX idx_readiness_company ON readiness_scores(company_id) WHERE company_id IS NOT NULL;


-- Group Discussion sessions
CREATE TABLE gd_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id            UUID REFERENCES company_drives(id),
  topic               TEXT NOT NULL,
  scheduled_at        TIMESTAMPTZ NOT NULL,
  duration_minutes    INTEGER DEFAULT 30,
  group_size_limit    INTEGER DEFAULT 8,
  status              TEXT DEFAULT 'scheduled'
                        CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  mongo_recording_id  TEXT,                        -- MongoDB gd_recordings ObjectId
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE gd_participants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gd_session_id       UUID NOT NULL REFERENCES gd_sessions(id),
  student_id          UUID NOT NULL REFERENCES users(id),
  contribution_score  NUMERIC(5,2),
  ai_score_breakdown  JSONB,                       -- {participation: 78, clarity: 82, leadership: 70}
  evaluator_score     NUMERIC(5,2),
  evaluator_notes     TEXT,
  joined_at           TIMESTAMPTZ,
  left_at             TIMESTAMPTZ,
  UNIQUE (gd_session_id, student_id)
);
CREATE INDEX idx_gd_participants_session ON gd_participants(gd_session_id);


-- Live interview slots & bookings
CREATE TABLE live_interview_slots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id            UUID NOT NULL REFERENCES company_drives(id),
  interviewer_ids     UUID[],
  scheduled_at        TIMESTAMPTZ NOT NULL,
  duration_minutes    INTEGER DEFAULT 45,
  status              TEXT DEFAULT 'available'
                        CHECK (status IN ('available', 'booked', 'completed', 'cancelled')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_live_slots_drive ON live_interview_slots(drive_id, status);


CREATE TABLE live_interview_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id         UUID NOT NULL REFERENCES live_interview_slots(id),
  student_id      UUID NOT NULL REFERENCES users(id),
  status          TEXT DEFAULT 'confirmed'
                    CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
  session_id      UUID REFERENCES placement_sessions(id),
  confirmed_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (slot_id),
  UNIQUE (student_id, slot_id)
);


-- Peer groups & practice
CREATE TABLE peer_groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  created_by      UUID REFERENCES users(id),
  max_members     INTEGER DEFAULT 10,
  is_private      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE peer_group_members (
  group_id        UUID NOT NULL REFERENCES peer_groups(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE peer_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id            UUID REFERENCES peer_groups(id),
  session_type        TEXT CHECK (session_type IN ('mock_interview', 'gd', 'group_test')),
  mongo_question_set  TEXT,                        -- MongoDB ObjectId
  scheduled_at        TIMESTAMPTZ,
  status              TEXT DEFAULT 'scheduled'
                        CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ╔══════════════════════════════════════════════════════════╗
-- ║  MODULE 3 — EXAM                                        ║
-- ╚══════════════════════════════════════════════════════════╝

CREATE TABLE exams (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT,
  exam_type           TEXT CHECK (exam_type IN ('practice', 'mock', 'live', 'assessment', 'competitive')),
  mode                TEXT DEFAULT 'scheduled'
                        CHECK (mode IN ('live', 'scheduled', 'flexible')),
  status              TEXT DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published', 'live', 'closed', 'archived')),
  creator_id          UUID NOT NULL REFERENCES users(id),
  total_marks         NUMERIC(8,2),
  duration_minutes    INTEGER NOT NULL,
  pass_percent        NUMERIC(5,2),
  negative_marking    NUMERIC(4,3) DEFAULT 0,
  is_proctored        BOOLEAN DEFAULT FALSE,
  shuffle_questions   BOOLEAN DEFAULT TRUE,
  shuffle_options     BOOLEAN DEFAULT TRUE,
  instructions        TEXT,
  target_exam_tags    TEXT[],                      -- GATE, JEE, CAT, etc.
  category            TEXT,
  difficulty          TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
  is_password_protected BOOLEAN DEFAULT FALSE,
  password_hash       TEXT,
  window_start        TIMESTAMPTZ,
  window_end          TIMESTAMPTZ,
  mongo_definition_id TEXT,                        -- MongoDB exam_definitions ObjectId
  template_id         UUID REFERENCES exams(id),  -- cloned from
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_exams_creator   ON exams(creator_id);
CREATE INDEX idx_exams_status    ON exams(status, window_start);
CREATE INDEX idx_exams_type      ON exams(exam_type);
CREATE TRIGGER trg_exams_updated_at BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Exam-batch access
CREATE TABLE exam_batch_access (
  exam_id         UUID NOT NULL REFERENCES exams(id),
  batch_id        UUID NOT NULL REFERENCES batches(id),
  granted_by      UUID REFERENCES users(id),
  granted_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (exam_id, batch_id)
);


-- Exam sections (structural metadata in PostgreSQL, question pools in MongoDB)
CREATE TABLE exam_sections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id             UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  section_order       INTEGER NOT NULL,
  time_limit_minutes  INTEGER,
  max_marks           NUMERIC(8,2),
  negative_marking    NUMERIC(4,3),
  is_locked           BOOLEAN DEFAULT FALSE,
  navigation_mode     TEXT DEFAULT 'free'
                        CHECK (navigation_mode IN ('free', 'sequential', 'locked')),
  mongo_pool_config   TEXT,                        -- MongoDB pool_config ObjectId
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_exam_sections_exam ON exam_sections(exam_id, section_order);


-- Exam attempts
CREATE TABLE exam_attempts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id             UUID NOT NULL REFERENCES exams(id),
  student_id          UUID NOT NULL REFERENCES users(id),
  attempt_number      INTEGER NOT NULL DEFAULT 1,
  status              TEXT DEFAULT 'in_progress'
                        CHECK (status IN ('in_progress', 'submitted', 'auto_submitted', 'disqualified', 'abandoned')),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at        TIMESTAMPTZ,
  time_taken_secs     INTEGER,
  ip_address          INET,
  device_fingerprint  TEXT,
  mongo_responses_id  TEXT,                        -- MongoDB exam_responses ObjectId
  proctoring_verdict  TEXT DEFAULT 'pending'
                        CHECK (proctoring_verdict IN ('pending', 'clean', 'flagged', 'disqualified')),
  violation_count     INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, exam_id, attempt_number)
);
CREATE INDEX idx_exam_attempts_student ON exam_attempts(student_id, exam_id);
CREATE INDEX idx_exam_attempts_exam    ON exam_attempts(exam_id, status);


-- Exam scores & rankings (partitioned by month for scale)
CREATE TABLE exam_scores (
  id                  UUID DEFAULT gen_random_uuid(),
  attempt_id          UUID NOT NULL REFERENCES exam_attempts(id),
  student_id          UUID NOT NULL REFERENCES users(id),
  exam_id             UUID NOT NULL REFERENCES exams(id),
  total_score         NUMERIC(8,2) NOT NULL,
  max_score           NUMERIC(8,2) NOT NULL,
  percentage          NUMERIC(5,2),
  passed              BOOLEAN,
  section_scores      JSONB,                       -- [{section_id, score, max, accuracy}]
  topic_scores        JSONB,                       -- [{topic, correct, total, accuracy}]
  time_taken_secs     INTEGER,
  computed_at         TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (computed_at);

CREATE TABLE exam_scores_2026_q1 PARTITION OF exam_scores
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE exam_scores_2026_q2 PARTITION OF exam_scores
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

CREATE INDEX idx_exam_scores_student ON exam_scores(student_id, exam_id);
CREATE INDEX idx_exam_scores_exam    ON exam_scores(exam_id, total_score DESC);


-- Exam rankings (computed after close)
CREATE TABLE exam_rankings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id             UUID NOT NULL REFERENCES exams(id),
  batch_id            UUID REFERENCES batches(id),          -- NULL = global ranking
  student_id          UUID NOT NULL REFERENCES users(id),
  rank                INTEGER NOT NULL,
  percentile          NUMERIC(5,2),
  score               NUMERIC(8,2),
  computed_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (exam_id, batch_id, student_id)
);
CREATE INDEX idx_rankings_exam  ON exam_rankings(exam_id, rank);
CREATE INDEX idx_rankings_batch ON exam_rankings(batch_id, rank) WHERE batch_id IS NOT NULL;


-- Notification logs (partitioned by month)
CREATE TABLE notification_logs (
  id              UUID DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  channel         TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'push', 'sms')),
  type            TEXT NOT NULL,
  title           TEXT,
  body            TEXT,
  metadata        JSONB,
  status          TEXT DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'failed', 'read')),
  sent_at         TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (sent_at);

CREATE TABLE notification_logs_2026_01 PARTITION OF notification_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');


-- ─────────────────────────────────────────────────────────────
-- INDEXES — CROSS-MODULE PERFORMANCE
-- ─────────────────────────────────────────────────────────────
-- Placement session leaderboard / percentile
CREATE INDEX idx_psessions_score ON placement_sessions(company_id, session_type, score DESC NULLS LAST);

-- Exam ability estimation window function support
CREATE INDEX idx_exam_attempts_window ON exam_attempts(student_id, started_at DESC);

-- BRIN for append-only logs
CREATE INDEX idx_audit_brin ON audit_logs USING brin(created_at);
