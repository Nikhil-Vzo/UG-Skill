import { QuizDefinitionModel, IQuizDefinition } from '../../db/mongo/models/lms';
import mongoose from 'mongoose';

export class QuizDefinitionRepository {
  async create(data: Partial<IQuizDefinition>) {
    const doc = new QuizDefinitionModel(data);
    return await doc.save();
  }

  async findById(quizId: string) {
    if (!mongoose.Types.ObjectId.isValid(quizId)) return null;
    return await QuizDefinitionModel.findById(quizId).lean();
  }

  async findByCourseAndAttachment(courseId: string, attachToType: string, attachToId: string) {
    return await QuizDefinitionModel.find({
      pg_course_id: courseId,
      'attach_to.type': attachToType,
      'attach_to.id': new mongoose.Types.ObjectId(attachToId),
    }).lean();
  }
}

export const quizDefinitionRepository = new QuizDefinitionRepository();
