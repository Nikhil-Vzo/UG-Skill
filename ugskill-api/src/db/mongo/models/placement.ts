import mongoose, { Schema, Document } from 'mongoose';

// ── question_bank (Placement) ─────────────────────────────────
export interface IQuestionBank extends Document {
  type: 'aptitude' | 'coding' | 'technical' | 'hr' | 'gd_topic';
  status: 'draft' | 'review' | 'published' | 'archived';
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard';
  subject?: string;
  topic?: string;
  tags?: string[];
  company_tags?: string[];
  source?: any;
  bloom_level?: string;
  estimated_solve_secs?: number;
  pg_created_by: string;
  stats?: any;
  stem?: string;
  schema_version: number;
}

const QuestionBankSchema = new Schema({
  type: { type: String, required: true },
  status: { type: String, default: 'draft' },
  difficulty: { type: String },
  subject: { type: String },
  topic: { type: String },
  tags: [String],
  company_tags: [String],
  source: { type: Schema.Types.Mixed },
  bloom_level: { type: String },
  estimated_solve_secs: { type: Number },
  pg_created_by: { type: String, required: true },
  stats: { type: Schema.Types.Mixed },
  stem: { type: String },
  schema_version: { type: Number, default: 1 },
}, { timestamps: true, strict: false }); // strict: false allows for polymorphic fields (coding vs hr)

QuestionBankSchema.index({ type: 1, difficulty: 1, status: 1 });
QuestionBankSchema.index({ company_tags: 1, type: 1 });
QuestionBankSchema.index({ subject: 1, topic: 1 }, { partialFilterExpression: { status: 'published' } });
QuestionBankSchema.index({ stem: 'text' });

export const QuestionBankModel = mongoose.models.QuestionBank || mongoose.model<IQuestionBank>('QuestionBank', QuestionBankSchema);


// ── interview_flows ───────────────────────────────────────────
export interface IInterviewFlow extends Document {
  pg_company_id: string;
  name: string;
  target_roles?: string[];
  status: string;
  version: number;
  dependency_mode?: string;
  rounds?: any[];
  active_version_pinned?: boolean;
  pg_created_by: string;
  schema_version: number;
}

const InterviewFlowSchema = new Schema({
  pg_company_id: { type: String, required: true },
  name: { type: String, required: true },
  target_roles: [String],
  status: { type: String, default: 'draft' },
  version: { type: Number, default: 1 },
  dependency_mode: { type: String },
  rounds: [Schema.Types.Mixed],
  active_version_pinned: { type: Boolean, default: true },
  pg_created_by: { type: String, required: true },
  schema_version: { type: Number, default: 1 },
}, { timestamps: true });

InterviewFlowSchema.index({ pg_company_id: 1, status: 1 });

export const InterviewFlowModel = mongoose.models.InterviewFlow || mongoose.model<IInterviewFlow>('InterviewFlow', InterviewFlowSchema);


// ── company_profiles ──────────────────────────────────────────
export interface ICompanyProfile extends Document {
  pg_company_id: string;
  about?: string;
  open_roles?: string[];
  ctc_packages?: any[];
  selection_process_overview?: string;
  past_hiring_stats?: any;
  required_skills?: any[];
  interview_patterns?: any[];
  gd_topics_history?: any[];
  schema_version: number;
}

const CompanyProfileSchema = new Schema({
  pg_company_id: { type: String, required: true },
  about: { type: String },
  open_roles: [String],
  ctc_packages: [Schema.Types.Mixed],
  selection_process_overview: { type: String },
  past_hiring_stats: { type: Schema.Types.Mixed },
  required_skills: [Schema.Types.Mixed],
  interview_patterns: [Schema.Types.Mixed],
  gd_topics_history: [Schema.Types.Mixed],
  schema_version: { type: Number, default: 1 },
}, { timestamps: true });

CompanyProfileSchema.index({ pg_company_id: 1 }, { unique: true });
CompanyProfileSchema.index({ 'required_skills.skill': 1 });

export const CompanyProfileModel = mongoose.models.CompanyProfile || mongoose.model<ICompanyProfile>('CompanyProfile', CompanyProfileSchema);


// ── mock_interview_attempts ───────────────────────────────────
export interface IMockInterviewAttempt extends Document {
  pg_session_id: string;
  pg_student_id: string;
  pg_company_id: string;
  flow_id: mongoose.Types.ObjectId;
  round_number: number;
  session_type: string;
  status: string;
  responses?: any[];
  aggregate_scores?: any;
  proctoring_flags?: any[];
  recording_url?: string;
  transcript_url?: string;
}

const MockInterviewAttemptSchema = new Schema({
  pg_session_id: { type: String, required: true },
  pg_student_id: { type: String, required: true },
  pg_company_id: { type: String },
  flow_id: { type: Schema.Types.ObjectId },
  round_number: { type: Number },
  session_type: { type: String },
  status: { type: String },
  responses: [Schema.Types.Mixed],
  aggregate_scores: { type: Schema.Types.Mixed },
  proctoring_flags: [Schema.Types.Mixed],
  recording_url: { type: String },
  transcript_url: { type: String }
}, { timestamps: true });

MockInterviewAttemptSchema.index({ pg_student_id: 1, createdAt: -1 });
MockInterviewAttemptSchema.index({ pg_session_id: 1 }, { unique: true });

export const MockInterviewAttemptModel = mongoose.models.MockInterviewAttempt || mongoose.model<IMockInterviewAttempt>('MockInterviewAttempt', MockInterviewAttemptSchema);


// ── gd_recordings ─────────────────────────────────────────────
export interface IGDRecording extends Document {
  pg_gd_session_id: string;
  video_url?: string;
  duration_secs?: number;
  participant_count?: number;
  transcript?: any[];
  ai_analysis?: any;
  schema_version: number;
}

const GDRecordingSchema = new Schema({
  pg_gd_session_id: { type: String, required: true },
  video_url: { type: String },
  duration_secs: { type: Number },
  participant_count: { type: Number },
  transcript: [Schema.Types.Mixed],
  ai_analysis: { type: Schema.Types.Mixed },
  schema_version: { type: Number, default: 1 },
}, { timestamps: { createdAt: true, updatedAt: false } });

GDRecordingSchema.index({ pg_gd_session_id: 1 }, { unique: true });

export const GDRecordingModel = mongoose.models.GDRecording || mongoose.model<IGDRecording>('GDRecording', GDRecordingSchema);
