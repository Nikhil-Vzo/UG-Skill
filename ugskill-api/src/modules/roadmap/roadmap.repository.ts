import { RoadmapModel, IRoadmap } from '../../db/mongo/models/lms';
import { Types } from 'mongoose';

export class RoadmapRepository {
  async createRoadmap(data: Partial<IRoadmap>): Promise<IRoadmap> {
    const roadmap = new RoadmapModel(data);
    return await roadmap.save();
  }

  async getRoadmapById(id: string): Promise<IRoadmap | null> {
    return await RoadmapModel.findById(id);
  }

  async updateRoadmap(id: string, data: Partial<IRoadmap>): Promise<IRoadmap | null> {
    return await RoadmapModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteRoadmap(id: string): Promise<IRoadmap | null> {
    return await RoadmapModel.findByIdAndDelete(id);
  }

  async addStage(roadmapId: string, stageData: any): Promise<IRoadmap | null> {
    const stage = {
      _id: new Types.ObjectId(),
      ...stageData,
    };
    return await RoadmapModel.findByIdAndUpdate(
      roadmapId,
      { $push: { stages: stage } },
      { new: true }
    );
  }
}

export const roadmapRepo = new RoadmapRepository();
