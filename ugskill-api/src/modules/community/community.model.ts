import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityPost extends Document {
  authorId: string;
  authorName: string;
  content: string;
  tags: string[];
  likes: string[];       // array of userIds
  bookmarks: string[];   // array of userIds
  replies: {
    authorId: string;
    authorName: string;
    content: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true, maxlength: 5000 },
    tags: { type: [String], default: [] },
    likes: { type: [String], default: [] },
    bookmarks: { type: [String], default: [] },
    replies: [
      {
        authorId: { type: String, required: true },
        authorName: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

CommunityPostSchema.index({ tags: 1 });
CommunityPostSchema.index({ createdAt: -1 });

export const CommunityPost = mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);
