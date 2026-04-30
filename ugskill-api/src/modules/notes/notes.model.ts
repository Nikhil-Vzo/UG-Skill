import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentNote extends Document {
  studentId: string;
  courseId: string;
  lectureId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentNoteSchema = new Schema<IStudentNote>(
  {
    studentId: { type: String, required: true, index: true },
    courseId: { type: String, required: true },
    lectureId: { type: String, required: true },
    content: { type: String, default: '' },
  },
  { timestamps: true }
);

// One note per student per lecture
StudentNoteSchema.index({ studentId: 1, courseId: 1, lectureId: 1 }, { unique: true });

export const StudentNote = mongoose.model<IStudentNote>('StudentNote', StudentNoteSchema);
