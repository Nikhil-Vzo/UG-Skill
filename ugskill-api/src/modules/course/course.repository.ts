import { CourseModel, ICourse } from '../../db/mongo/models/lms';
import { Types } from 'mongoose';

export class CourseRepository {
  async createCourse(data: Partial<ICourse>): Promise<ICourse> {
    const course = new CourseModel(data);
    return await course.save();
  }

  async getCourseById(id: string): Promise<ICourse | null> {
    return await CourseModel.findById(id);
  }

  async updateCourse(id: string, data: Partial<ICourse>): Promise<ICourse | null> {
    return await CourseModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteCourse(id: string): Promise<ICourse | null> {
    return await CourseModel.findByIdAndDelete(id);
  }

  async addSection(courseId: string, sectionData: any): Promise<ICourse | null> {
    const section = {
      _id: new Types.ObjectId(),
      ...sectionData,
      lectures: [],
    };
    return await CourseModel.findByIdAndUpdate(
      courseId,
      { $push: { sections: section } },
      { new: true }
    );
  }

  async addLectureToSection(courseId: string, sectionIdx: number, lectureData: any): Promise<ICourse | null> {
    const sectionKey = `sections.${sectionIdx}.lectures`;
    const lecture = {
      _id: new Types.ObjectId(),
      ...lectureData,
      created_at: new Date(),
    };
    return await CourseModel.findByIdAndUpdate(
      courseId,
      { $push: { [sectionKey]: lecture } },
      { new: true }
    );
  }

  async searchCourses(query?: string, filters?: { status?: string; category?: string }): Promise<ICourse[]> {
    const match: any = {};

    // Default to published for student-facing queries
    if (filters?.status) {
      match.status = filters.status;
    }
    if (filters?.category) {
      match.category = filters.category;
    }
    if (query) {
      match.$text = { $search: query };
    }

    return await CourseModel.find(match)
      .select('title category difficulty status is_free price avg_rating enrollment_count lecture_count thumbnail_url tags pg_creator_id')
      .limit(50)
      .lean();
  }
}

export const courseRepo = new CourseRepository();
