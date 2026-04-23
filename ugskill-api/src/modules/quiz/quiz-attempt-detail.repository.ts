import { QuizAttemptDetailModel } from '../../db/mongo/models/lms';
import mongoose from 'mongoose';

export class QuizAttemptDetailRepository {
  async saveDetail(data: {
    pg_attempt_id: string;
    pg_student_id: string;
    quiz_id: mongoose.Types.ObjectId;
    responses: any[];
    topic_accuracy?: any;
  }) {
    const doc = new QuizAttemptDetailModel(data);
    return await doc.save();
  }

  async getSummary(pgAttemptId: string) {
    return await QuizAttemptDetailModel.findOne({ pg_attempt_id: pgAttemptId }).lean();
  }
}

export const quizAttemptDetailRepository = new QuizAttemptDetailRepository();
