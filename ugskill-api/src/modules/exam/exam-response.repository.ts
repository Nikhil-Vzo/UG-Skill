import { ExamResponseModel } from '../../db/mongo/models/exam';
import { AppError, NotFoundError } from '../../lib/errors';
import mongoose from 'mongoose';

export class ExamResponseRepository {
  async create(data: { pg_attempt_id: string; pg_student_id: string; pg_exam_id: string; question_sequence?: string[] }) {
    try {
      const response = new ExamResponseModel({
        ...data,
        question_sequence: data.question_sequence?.map(id => new mongoose.Types.ObjectId(id)),
        responses: []
      });
      await response.save();
      return response;
    } catch (error: any) {
      throw new AppError(`Failed to create exam response: ${error.message}`, 500);
    }
  }

  async findByAttemptId(pg_attempt_id: string) {
    try {
      const response = await ExamResponseModel.findOne({ pg_attempt_id }).lean();
      return response;
    } catch (error: any) {
      throw new AppError(`Failed to find exam response: ${error.message}`, 500);
    }
  }

  // Save incremental responses (replaces previous response for the same question)
  async saveIncremental(pg_attempt_id: string, newResponses: any[]) {
    try {
      // For simplicity, we replace the entire responses array.
      // In a more optimize version, we could do array element updates, but since answers
      // arrays are typically small enough per attempt, overriding is safe and prevents duplicate pushes.
      const updated = await ExamResponseModel.findOneAndUpdate(
        { pg_attempt_id },
        { 
          $set: { responses: newResponses }
        },
        { new: true }
      ).lean();

      if (!updated) {
        throw new NotFoundError('Exam response document not found');
      }

      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError(`Failed to save incremental response: ${error.message}`, 500);
    }
  }

  async upsertSingleResponse(pg_attempt_id: string, response: any) {
    try {
      // 1. Remove any existing response for this question to avoid duplicates
      await ExamResponseModel.updateOne(
        { pg_attempt_id },
        { $pull: { responses: { question_id: response.question_id } } }
      );

      // 2. Push the new response
      const updated = await ExamResponseModel.findOneAndUpdate(
        { pg_attempt_id },
        { $push: { responses: response } },
        { new: true }
      ).lean();

      if (!updated) {
        throw new NotFoundError('Exam response document not found');
      }

      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError(`Failed to upsert single response: ${error.message}`, 500);
    }
  }

  async finalize(pg_attempt_id: string, finalResponses?: any[]) {
    try {
      const updateData: any = { submitted_at: new Date() };
      
      if (finalResponses) {
        updateData.responses = finalResponses;
      }

      const updated = await ExamResponseModel.findOneAndUpdate(
        { pg_attempt_id },
        { $set: updateData },
        { new: true }
      ).lean();

      if (!updated) {
        throw new NotFoundError('Exam response document not found');
      }

      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError(`Failed to finalize exam response: ${error.message}`, 500);
    }
  }

  async deleteByExamId(pg_exam_id: string) {
    try {
      await ExamResponseModel.deleteMany({ pg_exam_id });
      return true;
    } catch (error: any) {
      throw new AppError(`Failed to delete exam responses: ${error.message}`, 500);
    }
  }
}

export const examResponseRepository = new ExamResponseRepository();
