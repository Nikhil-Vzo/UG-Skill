CREATE TABLE "audit_logs" (
	"id" uuid DEFAULT gen_random_uuid(),
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" "inet",
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "batch_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'student',
	"joined_at" timestamp with time zone DEFAULT now(),
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"institution" text,
	"year" integer,
	"description" text,
	"status" text DEFAULT 'active',
	"created_by" uuid,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false,
	"password_hash" text,
	"full_name" text NOT NULL,
	"avatar_url" text,
	"phone" text,
	"roles" text[] DEFAULT ARRAY['student']::TEXT[],
	"institution" text,
	"branch" text,
	"cgpa" numeric(4, 2),
	"graduation_year" integer,
	"status" text DEFAULT 'active',
	"suspension_reason" text,
	"last_login_at" timestamp with time zone,
	"login_count" integer DEFAULT 0,
	"oauth_provider" text,
	"oauth_provider_id" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "exam_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'in_progress',
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"time_taken_secs" integer,
	"ip_address" "inet",
	"device_fingerprint" text,
	"mongo_responses_id" text,
	"proctoring_verdict" text DEFAULT 'pending',
	"violation_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exam_batch_access" (
	"exam_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"granted_by" uuid,
	"granted_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "exam_batch_access_exam_id_batch_id_pk" PRIMARY KEY("exam_id","batch_id")
);
--> statement-breakpoint
CREATE TABLE "exam_rankings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"batch_id" uuid,
	"student_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"percentile" numeric(5, 2),
	"score" numeric(8, 2),
	"computed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exam_scores" (
	"id" uuid DEFAULT gen_random_uuid(),
	"attempt_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"exam_id" uuid NOT NULL,
	"total_score" numeric(8, 2) NOT NULL,
	"max_score" numeric(8, 2) NOT NULL,
	"percentage" numeric(5, 2),
	"passed" boolean,
	"section_scores" jsonb,
	"topic_scores" jsonb,
	"time_taken_secs" integer,
	"computed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exam_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"name" text NOT NULL,
	"section_order" integer NOT NULL,
	"time_limit_minutes" integer,
	"max_marks" numeric(8, 2),
	"negative_marking" numeric(4, 3),
	"is_locked" boolean DEFAULT false,
	"navigation_mode" text DEFAULT 'free',
	"mongo_pool_config" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"exam_type" text,
	"mode" text DEFAULT 'scheduled',
	"status" text DEFAULT 'draft',
	"creator_id" uuid NOT NULL,
	"total_marks" numeric(8, 2),
	"duration_minutes" integer NOT NULL,
	"pass_percent" numeric(5, 2),
	"negative_marking" numeric(4, 3) DEFAULT '0',
	"is_proctored" boolean DEFAULT false,
	"shuffle_questions" boolean DEFAULT true,
	"shuffle_options" boolean DEFAULT true,
	"instructions" text,
	"target_exam_tags" text[],
	"category" text,
	"difficulty" text,
	"is_password_protected" boolean DEFAULT false,
	"password_hash" text,
	"window_start" timestamp with time zone,
	"window_end" timestamp with time zone,
	"mongo_definition_id" text,
	"template_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" uuid DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"type" text NOT NULL,
	"title" text,
	"body" text,
	"metadata" jsonb,
	"status" text DEFAULT 'sent',
	"sent_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assignment_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"assignment_id" text NOT NULL,
	"course_id" text NOT NULL,
	"file_urls" text[],
	"text_content" text,
	"attempt_number" integer DEFAULT 1,
	"status" text DEFAULT 'submitted',
	"score" numeric(5, 2),
	"max_score" numeric(5, 2),
	"graded_by" uuid,
	"graded_at" timestamp with time zone,
	"feedback" text,
	"submitted_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "batch_course_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"content_type" text NOT NULL,
	"content_id" text NOT NULL,
	"granted_by" uuid,
	"granted_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"cert_type" text NOT NULL,
	"reference_id" text NOT NULL,
	"reference_title" text NOT NULL,
	"verification_uuid" uuid DEFAULT gen_random_uuid(),
	"issued_at" timestamp with time zone DEFAULT now(),
	"pdf_url" text,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "certificates_verification_uuid_unique" UNIQUE("verification_uuid")
);
--> statement-breakpoint
CREATE TABLE "course_catalog" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"creator_id" uuid,
	"category" text,
	"sub_category" text,
	"difficulty" text,
	"language" text DEFAULT 'english',
	"thumbnail_url" text,
	"is_free" boolean DEFAULT false,
	"price" numeric(10, 2) DEFAULT '0',
	"status" text DEFAULT 'draft',
	"avg_rating" numeric(3, 2),
	"total_ratings" integer DEFAULT 0,
	"enrollment_count" integer DEFAULT 0,
	"lecture_count" integer DEFAULT 0,
	"total_duration_secs" integer DEFAULT 0,
	"tags" text[],
	"synced_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"course_id" text NOT NULL,
	"rating" smallint NOT NULL,
	"review_text" text,
	"helpful_count" integer DEFAULT 0,
	"status" text DEFAULT 'published',
	"moderated_at" timestamp with time zone,
	"moderated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"enrollable_type" text NOT NULL,
	"enrollable_id" text NOT NULL,
	"status" text DEFAULT 'active',
	"enrolled_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"progress_percent" numeric(5, 2) DEFAULT '0',
	"last_activity_at" timestamp with time zone,
	"source" text DEFAULT 'self',
	"batch_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lecture_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"lecture_id" text NOT NULL,
	"course_id" text NOT NULL,
	"enrollment_id" uuid,
	"completed_at" timestamp with time zone DEFAULT now(),
	"watch_time_secs" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "progress_summary" (
	"student_id" uuid NOT NULL,
	"course_id" text NOT NULL,
	"lectures_completed" integer DEFAULT 0,
	"total_lectures" integer DEFAULT 0,
	"total_watch_secs" integer DEFAULT 0,
	"last_lecture_id" text,
	"last_accessed_at" timestamp with time zone,
	"recomputed_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "progress_summary_student_id_course_id_pk" PRIMARY KEY("student_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"quiz_id" text NOT NULL,
	"course_id" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"max_score" numeric(5, 2) NOT NULL,
	"passed" boolean NOT NULL,
	"time_taken_secs" integer,
	"submitted_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roadmap_catalog" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"creator_id" uuid,
	"target_role" text,
	"difficulty" text,
	"thumbnail_url" text,
	"status" text DEFAULT 'draft',
	"stage_count" integer DEFAULT 0,
	"course_count" integer DEFAULT 0,
	"is_restricted" boolean DEFAULT false,
	"enrollment_count" integer DEFAULT 0,
	"synced_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_streaks" (
	"student_id" uuid PRIMARY KEY NOT NULL,
	"current_streak" integer DEFAULT 0,
	"best_streak" integer DEFAULT 0,
	"last_active_date" date,
	"freeze_credits" integer DEFAULT 0,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"industry" text,
	"tier" text,
	"difficulty_level" text,
	"website_url" text,
	"description" text,
	"ctc_range_lpa" "numrange",
	"mongo_profile_id" text,
	"status" text DEFAULT 'active',
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "company_drives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"target_roles" text[],
	"eligibility" jsonb,
	"batch_ids" uuid[],
	"mongo_flow_id" text,
	"status" text DEFAULT 'upcoming',
	"scheduled_at" timestamp with time zone,
	"registration_deadline" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drive_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drive_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"eligibility_ok" boolean DEFAULT false,
	"status" text DEFAULT 'registered',
	"registered_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gd_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gd_session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"contribution_score" numeric(5, 2),
	"ai_score_breakdown" jsonb,
	"evaluator_score" numeric(5, 2),
	"evaluator_notes" text,
	"joined_at" timestamp with time zone,
	"left_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "gd_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drive_id" uuid,
	"topic" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 30,
	"group_size_limit" integer DEFAULT 8,
	"status" text DEFAULT 'scheduled',
	"mongo_recording_id" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "live_interview_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" text DEFAULT 'confirmed',
	"session_id" uuid,
	"confirmed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "live_interview_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drive_id" uuid NOT NULL,
	"interviewer_ids" uuid[],
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 45,
	"status" text DEFAULT 'available',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "peer_group_members" (
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "peer_group_members_group_id_user_id_pk" PRIMARY KEY("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "peer_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" uuid,
	"max_members" integer DEFAULT 10,
	"is_private" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "peer_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid,
	"session_type" text,
	"mongo_question_set" text,
	"scheduled_at" timestamp with time zone,
	"status" text DEFAULT 'scheduled',
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "placement_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"session_type" text NOT NULL,
	"drive_id" uuid,
	"company_id" uuid,
	"mongo_flow_id" text,
	"round_number" integer,
	"status" text DEFAULT 'scheduled',
	"score" numeric(5, 2),
	"max_score" numeric(5, 2),
	"percentile" numeric(5, 2),
	"mongo_attempt_id" text,
	"recording_url" text,
	"proctoring_verdict" text,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "readiness_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"company_id" uuid,
	"overall_score" numeric(5, 2) NOT NULL,
	"components" jsonb,
	"sessions_count" integer DEFAULT 0,
	"computed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_members" ADD CONSTRAINT "batch_members_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_members" ADD CONSTRAINT "batch_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_batch_access" ADD CONSTRAINT "exam_batch_access_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_batch_access" ADD CONSTRAINT "exam_batch_access_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_batch_access" ADD CONSTRAINT "exam_batch_access_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_rankings" ADD CONSTRAINT "exam_rankings_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_rankings" ADD CONSTRAINT "exam_rankings_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_rankings" ADD CONSTRAINT "exam_rankings_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_attempt_id_exam_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sections" ADD CONSTRAINT "exam_sections_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_course_access" ADD CONSTRAINT "batch_course_access_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_course_access" ADD CONSTRAINT "batch_course_access_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_catalog" ADD CONSTRAINT "course_catalog_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lecture_completions" ADD CONSTRAINT "lecture_completions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lecture_completions" ADD CONSTRAINT "lecture_completions_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_summary" ADD CONSTRAINT "progress_summary_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_catalog" ADD CONSTRAINT "roadmap_catalog_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_streaks" ADD CONSTRAINT "student_streaks_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_drives" ADD CONSTRAINT "company_drives_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_drives" ADD CONSTRAINT "company_drives_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_registrations" ADD CONSTRAINT "drive_registrations_drive_id_company_drives_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."company_drives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_registrations" ADD CONSTRAINT "drive_registrations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gd_participants" ADD CONSTRAINT "gd_participants_gd_session_id_gd_sessions_id_fk" FOREIGN KEY ("gd_session_id") REFERENCES "public"."gd_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gd_participants" ADD CONSTRAINT "gd_participants_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gd_sessions" ADD CONSTRAINT "gd_sessions_drive_id_company_drives_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."company_drives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gd_sessions" ADD CONSTRAINT "gd_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_interview_bookings" ADD CONSTRAINT "live_interview_bookings_slot_id_live_interview_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."live_interview_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_interview_bookings" ADD CONSTRAINT "live_interview_bookings_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_interview_bookings" ADD CONSTRAINT "live_interview_bookings_session_id_placement_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."placement_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_interview_slots" ADD CONSTRAINT "live_interview_slots_drive_id_company_drives_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."company_drives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_group_members" ADD CONSTRAINT "peer_group_members_group_id_peer_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."peer_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_group_members" ADD CONSTRAINT "peer_group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_groups" ADD CONSTRAINT "peer_groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_sessions" ADD CONSTRAINT "peer_sessions_group_id_peer_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."peer_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_sessions" ADD CONSTRAINT "peer_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_sessions" ADD CONSTRAINT "placement_sessions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_sessions" ADD CONSTRAINT "placement_sessions_drive_id_company_drives_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."company_drives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_sessions" ADD CONSTRAINT "placement_sessions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_scores" ADD CONSTRAINT "readiness_scores_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_scores" ADD CONSTRAINT "readiness_scores_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;