import mongoose, { Schema, Document } from 'mongoose';

// ── courses ─────────────────────────────────────────────────
export interface ICourse extends Document {
  title: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  pg_creator_id: string;
  schema_version: number;
  category?: string;
  sub_category?: string;
  difficulty?: string;
  language?: string;
  thumbnail_url?: string;
  is_free?: boolean;
  price?: number;
  tags?: string[];
  sections?: any[];
  avg_rating?: number;
  total_ratings?: number;
  enrollment_count?: number;
  lecture_count?: number;
  total_duration_secs?: number;
  version?: number;
  version_history?: any[];
}

const CourseSchema = new Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['draft', 'review', 'published', 'archived'], required: true },
  pg_creator_id: { type: String, required: true },
  schema_version: { type: Number, required: true, default: 1 },
  category: { type: String },
  sub_category: { type: String },
  difficulty: { type: String },
  language: { type: String, default: 'english' },
  thumbnail_url: { type: String },
  is_free: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  tags: [String],
  sections: [Schema.Types.Mixed],
  avg_rating: { type: Number },
  total_ratings: { type: Number, default: 0 },
  enrollment_count: { type: Number, default: 0 },
  lecture_count: { type: Number, default: 0 },
  total_duration_secs: { type: Number, default: 0 },
  version: { type: Number, default: 1 },
  version_history: [Schema.Types.Mixed],
}, { timestamps: true });

CourseSchema.index({ pg_creator_id: 1, status: 1 });
CourseSchema.index({ status: 1, category: 1 });
CourseSchema.index({ title: 'text', description: 'text' });
CourseSchema.index({ tags: 1 });

export const CourseModel = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);


// ── roadmaps ────────────────────────────────────────────────
export interface IRoadmap extends Document {
  title: string;
  status: string;
  pg_creator_id: string;
  schema_version: number;
  description?: string;
  goal_statement?: string;
  target_role?: string;
  is_restricted?: boolean;
  difficulty?: string;
  thumbnail_url?: string;
  stages?: any[];
}

const RoadmapSchema = new Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], required: true },
  pg_creator_id: { type: String, required: true },
  schema_version: { type: Number, default: 1 },
  description: { type: String },
  goal_statement: { type: String },
  target_role: { type: String },
  is_restricted: { type: Boolean, default: false },
  difficulty: { type: String },
  thumbnail_url: { type: String },
  stages: [Schema.Types.Mixed],
}, { timestamps: true });

RoadmapSchema.index({ pg_creator_id: 1, status: 1 });
RoadmapSchema.index({ title: 'text' });

export const RoadmapModel = mongoose.models.Roadmap || mongoose.model<IRoadmap>('Roadmap', RoadmapSchema);


// ── quiz_definitions ─────────────────────────────────────────
export interface IQuizDefinition extends Document {
  pg_course_id: string;
  pg_creator_id: string;
  title: string;
  attach_to: { type: string, id: mongoose.Types.ObjectId };
  config: any;
  questions: any[];
  schema_version: number;
}

const QuizDefinitionSchema = new Schema({
  pg_course_id: { type: String, required: true },
  pg_creator_id: { type: String, required: true },
  title: { type: String, required: true },
  attach_to: {
    type: { type: String },
    id: { type: Schema.Types.ObjectId }
  },
  config: { type: Schema.Types.Mixed },
  questions: [Schema.Types.Mixed],
  schema_version: { type: Number, default: 1 },
}, { timestamps: true });

QuizDefinitionSchema.index({ pg_course_id: 1 });
QuizDefinitionSchema.index({ 'attach_to.id': 1 });

export const QuizDefinitionModel = mongoose.models.QuizDefinition || mongoose.model<IQuizDefinition>('QuizDefinition', QuizDefinitionSchema);


// ── quiz_attempt_details ─────────────────────────────────────
export interface IQuizAttemptDetail extends Document {
  pg_attempt_id: string;
  pg_student_id: string;
  quiz_id: mongoose.Types.ObjectId;
  responses: any[];
  topic_accuracy?: any;
}

const QuizAttemptDetailSchema = new Schema({
  pg_attempt_id: { type: String, required: true },
  pg_student_id: { type: String, required: true },
  quiz_id: { type: Schema.Types.ObjectId, required: true },
  responses: [Schema.Types.Mixed],
  topic_accuracy: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });

QuizAttemptDetailSchema.index({ pg_student_id: 1, quiz_id: 1 });
QuizAttemptDetailSchema.index({ pg_attempt_id: 1 }, { unique: true });

export const QuizAttemptDetailModel = mongoose.models.QuizAttemptDetail || mongoose.model<IQuizAttemptDetail>('QuizAttemptDetail', QuizAttemptDetailSchema);


// ── ai_chat_sessions ─────────────────────────────────────────
export interface IAIChatSession extends Document {
  pg_student_id: string;
  context: any;
  messages: any[];
  session_type: string;
  schema_version: number;
}

const AIChatSessionSchema = new Schema({
  pg_student_id: { type: String, required: true },
  context: { type: Schema.Types.Mixed },
  messages: [Schema.Types.Mixed],
  session_type: { type: String, required: true },
  schema_version: { type: Number, default: 1 },
}, { timestamps: true });

AIChatSessionSchema.index({ pg_student_id: 1, 'context.course_id': 1 });
AIChatSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export const AIChatSessionModel = mongoose.models.AIChatSession || mongoose.model<IAIChatSession>('AIChatSession', AIChatSessionSchema);


// ── activity_events ──────────────────────────────────────────
export interface IActivityEvent extends Document {
  pg_student_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  course_id?: string;
  metadata?: any;
  session_id?: string;
}

const ActivityEventSchema = new Schema({
  pg_student_id: { type: String, required: true },
  event_type: { type: String, required: true },
  entity_type: { type: String, required: true },
  entity_id: { type: String, required: true },
  course_id: { type: String },
  metadata: { type: Schema.Types.Mixed },
  session_id: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

ActivityEventSchema.index({ pg_student_id: 1, createdAt: -1 });
ActivityEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export const ActivityEventModel = mongoose.models.ActivityEvent || mongoose.model<IActivityEvent>('ActivityEvent', ActivityEventSchema);
