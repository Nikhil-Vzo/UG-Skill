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

  async findAll(query: any = {}) {
    return await QuizDefinitionModel.find(query).sort({ createdAt: -1 }).lean();
  }

  async update(quizId: string, data: Partial<IQuizDefinition>) {
    if (!mongoose.Types.ObjectId.isValid(quizId)) return null;
    return await QuizDefinitionModel.findByIdAndUpdate(quizId, data, { new: true }).lean();
  }
}

export const quizDefinitionRepository = new QuizDefinitionRepository();
