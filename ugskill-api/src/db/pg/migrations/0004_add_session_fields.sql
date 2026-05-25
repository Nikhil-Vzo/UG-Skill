ALTER TABLE "placement_sessions" ADD COLUMN "round_label" text;--> statement-breakpoint
ALTER TABLE "placement_sessions" ADD COLUMN "scheduled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "placement_sessions" ADD COLUMN "feedback_notes" text;