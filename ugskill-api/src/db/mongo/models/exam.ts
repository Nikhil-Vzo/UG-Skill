import mongoose, { Schema, Document } from 'mongoose';

// ── exam_question_bank ───────────────────────────────────────
export interface IExamQuestionBank extends Document {
  type: string;
  status: string;
  stem?: string;
  difficulty?: string;
  subject?: string;
  topic?: string;
  tags?: string[];
  source_type?: string;
  source_exam?: string;
  source_year?: number;
  pg_created_by: string;
  bloom_level?: string;
  estimated_time_secs?: number;
  marks?: number;
  negative_marks?: number;
  media_attachments?: any[];
  options?: any[];
  explanation?: string;
  stats?: any;
  version?: number;
  version_history?: any[];
  schema_version: number;
}

const ExamQuestionBankSchema = new Schema({
  type: { type: String, required: true },
  status: { type: String, default: 'draft' },
  stem: { type: String },
  difficulty: { type: String },
  subject: { type: String },
  topic: { type: String },
  tags: [String],
  source_type: { type: String },
  source_exam: { type: String },
  source_year: { type: Number },
  pg_created_by: { type: String, required: true },
  bloom_level: { type: String },
  estimated_time_secs: { type: Number },
  marks: { type: Number },
  negative_marks: { type: Number },
  media_attachments: [Schema.Types.Mixed],
  options: [Schema.Types.Mixed],
  explanation: { type: String },
  stats: { type: Schema.Types.Mixed },
  version: { type: Number, default: 1 },
  version_history: [Schema.Types.Mixed],
  schema_version: { type: Number, default: 1 },
}, { timestamps: true, strict: false }); // strict: false for polymorphic fields

ExamQuestionBankSchema.index({ type: 1, difficulty: 1, status: 1 });
ExamQuestionBankSchema.index({ subject: 1, topic: 1 }, { partialFilterExpression: { status: 'published' } });
ExamQuestionBankSchema.index({ stem: 'text', explanation: 'text' });
ExamQuestionBankSchema.index({ tags: 1 });
ExamQuestionBankSchema.index({ source_exam: 1, source_year: -1 });

export const ExamQuestionBankModel = mongoose.models.ExamQuestionBank || mongoose.model<IExamQuestionBank>('ExamQuestionBank', ExamQuestionBankSchema);


// ── exam_definitions ──────────────────────────────────────────
export interface IExamDefinition extends Document {
  pg_exam_id: string;
  sections?: any[];
  template_notes?: string;
  schema_version: number;
}

const ExamDefinitionSchema = new Schema({
  pg_exam_id: { type: String, required: true },
  sections: [Schema.Types.Mixed],
  template_notes: { type: String },
  schema_version: { type: Number, default: 1 },
}, { timestamps: true });

ExamDefinitionSchema.index({ pg_exam_id: 1 }, { unique: true });

export const ExamDefinitionModel = mongoose.models.ExamDefinition || mongoose.model<IExamDefinition>('ExamDefinition', ExamDefinitionSchema);


// ── exam_responses ────────────────────────────────────────────
export interface IExamResponse extends Document {
  pg_attempt_id: string;
  pg_student_id: string;
  pg_exam_id: string;
  question_sequence?: mongoose.Types.ObjectId[];
  responses?: any[];
  topic_summary?: any[];
  submitted_at?: Date;
  schema_version: number;
}

const ExamResponseSchema = new Schema({
  pg_attempt_id: { type: String, required: true },
  pg_student_id: { type: String, required: true },
  pg_exam_id: { type: String, required: true },
  question_sequence: [{ type: Schema.Types.ObjectId }],
  responses: [Schema.Types.Mixed],
  topic_summary: [Schema.Types.Mixed],
  submitted_at: { type: Date },
  schema_version: { type: Number, default: 1 },
}, { timestamps: { createdAt: true, updatedAt: false } });

ExamResponseSchema.index({ pg_student_id: 1, pg_exam_id: 1 });
ExamResponseSchema.index({ pg_attempt_id: 1 }, { unique: true });

export const ExamResponseModel = mongoose.models.ExamResponse || mongoose.model<IExamResponse>('ExamResponse', ExamResponseSchema);


// ── exam_proctoring_events ────────────────────────────────────
export interface IExamProctoringEvent extends Document {
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

const ExamProctoringEventSchema = new Schema({
  module: { type: String, default: 'exam' },
  session_id: { type: String, required: true },
  pg_student_id: { type: String, required: true },
  event_type: { type: String, required: true },
  severity: { type: String, required: true },
  confidence: { type: Number },
  evidence_snapshot_url: { type: String },
  metadata: { type: Schema.Types.Mixed },
  timestamp: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

ExamProctoringEventSchema.index({ session_id: 1, timestamp: 1 });
ExamProctoringEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // TTL 12 months

export const ExamProctoringEventModel = mongoose.models.ExamProctoringEvent || mongoose.model<IExamProctoringEvent>('ExamProctoringEvent', ExamProctoringEventSchema);
