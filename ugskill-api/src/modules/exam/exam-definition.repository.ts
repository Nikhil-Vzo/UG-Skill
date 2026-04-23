import { ExamDefinitionModel } from '../../db/mongo/models/exam';
import { AppError, NotFoundError } from '../../lib/errors';

export class ExamDefinitionRepository {
  async create(pg_exam_id: string, data: any) {
    try {
      const definition = new ExamDefinitionModel({
        pg_exam_id,
        ...data
      });
      await definition.save();
      return definition;
    } catch (error: any) {
      throw new AppError(`Failed to create exam definition: ${error.message}`, 500);
    }
  }

  async findByPgExamId(pg_exam_id: string) {
    try {
      const definition = await ExamDefinitionModel.findOne({ pg_exam_id }).lean();
      return definition;
    } catch (error: any) {
      throw new AppError(`Failed to find exam definition: ${error.message}`, 500);
    }
  }

  async update(pg_exam_id: string, data: any) {
    try {
      const updated = await ExamDefinitionModel.findOneAndUpdate(
        { pg_exam_id },
        { $set: data },
        { new: true, runValidators: true }
      ).lean();

      if (!updated) {
        throw new NotFoundError('Exam definition not found in Mongo');
      }
      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError(`Failed to update exam definition: ${error.message}`, 500);
    }
  }
}

export const examDefinitionRepository = new ExamDefinitionRepository();
