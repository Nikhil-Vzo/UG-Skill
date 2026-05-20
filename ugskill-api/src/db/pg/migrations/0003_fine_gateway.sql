ALTER TABLE "exam_attempts" DROP CONSTRAINT "exam_attempts_exam_id_exams_id_fk";
--> statement-breakpoint
ALTER TABLE "exam_batch_access" DROP CONSTRAINT "exam_batch_access_exam_id_exams_id_fk";
--> statement-breakpoint
ALTER TABLE "exam_rankings" DROP CONSTRAINT "exam_rankings_exam_id_exams_id_fk";
--> statement-breakpoint
ALTER TABLE "exam_scores" DROP CONSTRAINT "exam_scores_attempt_id_exam_attempts_id_fk";
--> statement-breakpoint
ALTER TABLE "exam_scores" DROP CONSTRAINT "exam_scores_exam_id_exams_id_fk";
--> statement-breakpoint
ALTER TABLE "exam_scores" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "exam_scores" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "notification_logs" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "resume_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "resume_data" jsonb;--> statement-breakpoint
ALTER TABLE "progress_summary" ADD COLUMN "bookmarks" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_batch_access" ADD CONSTRAINT "exam_batch_access_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_rankings" ADD CONSTRAINT "exam_rankings_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_attempt_id_exam_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;