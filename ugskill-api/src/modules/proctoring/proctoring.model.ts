import mongoose, { Schema, Document } from 'mongoose';

export interface IProctoringEvent extends Document {
  attemptId: string;
  examId: string;
  studentId: string;
  type: 'gaze_away' | 'no_face' | 'multiple_faces' | 'eyes_closed' | 'tab_switch' | 'copy_paste' | 'fullscreen_exit';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  aiConfidence: number;          // 0–1, from AI API
  gazeDirection?: string;         // 'left' | 'right' | 'down' | 'up'
  frameTimestamp: Date;
  riskScoreAtEvent: number;       // cumulative risk score at this point
  overriddenBy?: string;           // admin userId if false-positive cleared
  overrideReason?: string;
  evidenceUrl?: string;           // URL to image frame if saved
  metadata?: any;
}

const ProctoringEventSchema = new Schema({
  attemptId: { type: String, required: true },
  examId: { type: String, required: true },
  studentId: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['gaze_away', 'no_face', 'multiple_faces', 'eyes_closed', 'tab_switch', 'copy_paste', 'fullscreen_exit']
  },
  severity: { 
    type: String, 
    required: true,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  },
  aiConfidence: { type: Number, default: 1.0 },
  gazeDirection: { type: String },
  frameTimestamp: { type: Date, default: Date.now },
  riskScoreAtEvent: { type: Number, default: 0 },
  overriddenBy: { type: String },
  overrideReason: { type: String },
  evidenceUrl: { type: String },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: true } });

ProctoringEventSchema.index({ attemptId: 1, frameTimestamp: 1 });
ProctoringEventSchema.index({ studentId: 1, type: 1 });
ProctoringEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // TTL 1 year

export const ProctoringEventModel = mongoose.models.ProctoringEvent || mongoose.model<IProctoringEvent>('ProctoringEvent', ProctoringEventSchema);
