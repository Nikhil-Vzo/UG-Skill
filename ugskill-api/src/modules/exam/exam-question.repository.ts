import { ExamQuestionBankModel } from '../../db/mongo/models/exam';
import { AppError, NotFoundError } from '../../lib/errors';

export class ExamQuestionRepository {
  async create(data: any) {
    try {
      const question = new ExamQuestionBankModel(data);
      await question.save();
      return question;
    } catch (error: any) {
      throw new AppError(`Failed to create exam question: ${error.message}`, 500);
    }
  }

  async findById(id: string) {
    try {
      const question = await ExamQuestionBankModel.findById(id).lean();
      if (!question) {
        throw new NotFoundError('Question not found');
      }
      return question;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError(`Failed to fetch exam question: ${error.message}`, 500);
    }
  }

  async findMany(filters: { type?: string; difficulty?: string; status?: string; subject?: string; topic?: string; tags?: string; page?: number; limit?: number }) {
    try {
      const page = Math.max(1, Number(filters.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
      const offset = (page - 1) * limit;
      
      const query: any = {};
      if (filters.status) query.status = filters.status;
      else query.status = { $ne: 'archived' };

      if (filters.type) query.type = filters.type;
      if (filters.difficulty) query.difficulty = filters.difficulty;
      if (filters.subject) query.subject = filters.subject;
      if (filters.topic) query.topic = filters.topic;
      if (filters.tags) query.tags = filters.tags;

      const [data, total] = await Promise.all([
        ExamQuestionBankModel.find(query)
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit)
          .lean(),
        ExamQuestionBankModel.countDocuments(query)
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      throw new AppError(`Failed to list exam questions: ${error.message}`, 500);
    }
  }

  async update(id: string, data: any) {
    try {
      const updated = await ExamQuestionBankModel.findByIdAndUpdate(
        id,
        { $set: data, $inc: { version: 1 } },
        { new: true, runValidators: true }
      ).lean();

      if (!updated) {
        throw new NotFoundError('Question not found');
      }
      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError(`Failed to update exam question: ${error.message}`, 500);
    }
  }

  async archive(id: string) {
    try {
      const archived = await ExamQuestionBankModel.findByIdAndUpdate(
        id,
        { $set: { status: 'archived' } },
        { new: true }
      ).lean();

      return !!archived;
    } catch (error: any) {
      throw new AppError(`Failed to archive exam question: ${error.message}`, 500);
    }
  }
}

export const examQuestionRepository = new ExamQuestionRepository();
