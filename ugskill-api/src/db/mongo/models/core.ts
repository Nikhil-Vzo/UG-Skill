import mongoose, { Schema, Document } from 'mongoose';

// ── proctoring_events (Shared / Placement) ─────────────────────
export interface IProctoringEvent extends Document {
  module: string;
  session_id: string;
  pg_student_id: string;
  event_type: string;
  severity: string;
  confidence?: number;
  evidence_snapshot_url?: string;
  metadata?: any;
  timestamp: Date;
}

const ProctoringEventSchema = new Schema({
  module: { type: String, required: true },
  session_id: { type: String, required: true },
  pg_student_id: { type: String, required: true },
  event_type: { type: String, required: true },
  severity: { type: String, required: true },
  confidence: { type: Number },
  evidence_snapshot_url: { type: String },
  metadata: { type: Schema.Types.Mixed },
  timestamp: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

ProctoringEventSchema.index({ session_id: 1, createdAt: 1 });
ProctoringEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // TTL 90 days

export const ProctoringEventModel = mongoose.models.ProctoringEvent || mongoose.model<IProctoringEvent>('ProctoringEvent', ProctoringEventSchema);


// ── user_snapshots ────────────────────────────────────────────
export interface IUserSnapshot extends Document {
  pg_user_id: string;
  full_name?: string;
  institution?: string;
  branch?: string;
  cgpa?: number;
  graduation_year?: number;
  roles?: string[];
  skill_profile?: any;
  enrolled_course_ids?: string[];
  target_companies?: string[];
  synced_at?: Date;
}

const UserSnapshotSchema = new Schema({
  pg_user_id: { type: String, required: true },
  full_name: { type: String },
  institution: { type: String },
  branch: { type: String },
  cgpa: { type: Number },
  graduation_year: { type: Number },
  roles: [String],
  skill_profile: { type: Schema.Types.Mixed },
  enrolled_course_ids: [String],
  target_companies: [String],
  synced_at: { type: Date },
});

UserSnapshotSchema.index({ pg_user_id: 1 }, { unique: true });

export const UserSnapshotModel = mongoose.models.UserSnapshot || mongoose.model<IUserSnapshot>('UserSnapshot', UserSnapshotSchema);


// ── ai_generated_content ─────────────────────────────────────
export interface IAIGeneratedContent extends Document {
  content_type: string;
  generator_model?: string;
  pg_created_by: string;
  input_context?: any;
  output?: any;
  review_status?: string;
  reviewed_by?: string | null;
  schema_version: number;
}

const AIGeneratedContentSchema = new Schema({
  content_type: { type: String, required: true },
  generator_model: { type: String },
  pg_created_by: { type: String, required: true },
  input_context: { type: Schema.Types.Mixed },
  output: { type: Schema.Types.Mixed },
  review_status: { type: String, default: 'pending' },
  reviewed_by: { type: String, default: null },
  schema_version: { type: Number, default: 1 },
}, { timestamps: { createdAt: true, updatedAt: false } });

AIGeneratedContentSchema.index({ content_type: 1, review_status: 1 });
AIGeneratedContentSchema.index({ pg_created_by: 1, createdAt: -1 });
AIGeneratedContentSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // TTL 90 days

export const AIGeneratedContentModel = mongoose.models.AIGeneratedContent || mongoose.model<IAIGeneratedContent>('AIGeneratedContent', AIGeneratedContentSchema);
