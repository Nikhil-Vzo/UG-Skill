import mongoose, { Schema, Document } from 'mongoose';

export interface IAiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  context?: any;
  timestamp: Date;
}

export interface IAiChatSession extends Document {
  sessionId: string;
  userId: string;
  messages: IAiChatMessage[];
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface IAiGeneratedContent extends Document {
  userId: string;
  type: string; // 'roadmap', 'description', 'code'
  prompt: string;
  content: string;
  metadata?: any;
  status: 'pending_review' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const AiChatSessionSchema = new Schema<IAiChatSession>({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    context: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['active', 'archived'], default: 'active' }
}, { timestamps: true });

const AiGeneratedContentSchema = new Schema<IAiGeneratedContent>({
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  prompt: { type: String, required: true },
  content: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['pending_review', 'approved', 'rejected'], default: 'pending_review' }
}, { timestamps: true });

export const AiChatSessionModel = mongoose.model<IAiChatSession>('AiChatSession', AiChatSessionSchema);
export const AiGeneratedContentModel = mongoose.model<IAiGeneratedContent>('AiGeneratedContent', AiGeneratedContentSchema);
