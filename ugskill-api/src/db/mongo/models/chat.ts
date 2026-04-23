import mongoose, { Document, Schema } from 'mongoose';

// ─── Chat Message ────────────────────────────────────────────────────────────
export interface IChatMessage extends Document {
  room: string;         // e.g. "gd:{sessionId}" | "support:{ticketId}"
  senderId: string;     // PG user uuid
  senderEmail: string;
  content: string;
  sentAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    room:        { type: String, required: true, index: true },
    senderId:    { type: String, required: true },
    senderEmail: { type: String, required: true },
    content:     { type: String, required: true, maxlength: 4000 },
    sentAt:      { type: Date,   required: true, default: () => new Date() },
  },
  {
    collection: 'chat_messages',
    timestamps: false,
  }
);

// TTL — auto-purge messages older than 90 days
ChatMessageSchema.index({ sentAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const ChatMessageModel = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
