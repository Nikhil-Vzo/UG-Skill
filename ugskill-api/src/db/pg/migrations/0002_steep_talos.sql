ALTER TABLE "exams" ADD COLUMN "gaze_threshold" integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "face_timeout_seconds" integer DEFAULT 10;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "allow_multiple_faces" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "auto_terminate_score" integer DEFAULT 80;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "frame_capture_interval_sec" integer DEFAULT 5;