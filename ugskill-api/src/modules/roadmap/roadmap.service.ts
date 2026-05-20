import { roadmapRepo } from './roadmap.repository';
import { roadmapCatalogRepo } from './roadmap-catalog.repository';
import { AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { events, APP_EVENTS } from '../../lib/events';

export class RoadmapService {
  async createRoadmap(data: any, creatorId: string) {
    // 1. Create in Mongo
    const mongoData = {
      ...data,
      pg_creator_id: creatorId,
      status: data.status || 'draft',
    };
    const roadmap = await roadmapRepo.createRoadmap(mongoData);

    // 2. Async Sync to Postgres via CDC
    events.emit(APP_EVENTS.ROADMAP_CREATED, {
      roadmapId: roadmap._id.toString(),
      title: roadmap.title,
      description: data.description,
      creatorId: creatorId,
      targetRole: roadmap.target_role,
      difficulty: roadmap.difficulty,
      thumbnailUrl: roadmap.thumbnail_url,
      status: roadmap.status,
      isRestricted: roadmap.is_restricted,
      stageCount: roadmap.stages?.length || 0,
      courseCount: roadmap.stages?.reduce((sum: number, s: any) => sum + (s.courseIds?.length || 0), 0) || 0,
    });

    return roadmap;
  }

  async getRoadmap(id: string) {
    const roadmap = await roadmapRepo.getRoadmapById(id);
    if (!roadmap) {
      throw new AppError('Roadmap not found', 404);
    }
    return roadmap;
  }

  async updateRoadmap(id: string, data: any) {
    const roadmap = await roadmapRepo.updateRoadmap(id, data);
    if (!roadmap) {
      throw new AppError('Roadmap not found', 404);
    }

    // Sync to Postgres via CDC
    events.emit(APP_EVENTS.ROADMAP_UPDATED, {
      roadmapId: roadmap._id.toString(),
      title: roadmap.title,
      description: data.description || roadmap.description,
      targetRole: roadmap.target_role,
      difficulty: roadmap.difficulty,
      thumbnailUrl: roadmap.thumbnail_url,
      status: roadmap.status,
      isRestricted: roadmap.is_restricted,
      stageCount: roadmap.stages?.length || 0,
      courseCount: roadmap.stages?.reduce((sum: number, s: any) => sum + (s.courseIds?.length || 0), 0) || 0,
    });

    return roadmap;
  }

  async deleteRoadmap(id: string) {
    await roadmapCatalogRepo.deleteCatalog(id);
    const result = await roadmapRepo.deleteRoadmap(id);
    if (!result) {
      throw new AppError('Roadmap not found', 404);
    }
    return { success: true };
  }

  async addStage(roadmapId: string, data: any) {
    const roadmap = await roadmapRepo.addStage(roadmapId, data);
    if (!roadmap) throw new AppError('Roadmap not found', 404);

    // Sync stage count to PG catalog via CDC
    events.emit(APP_EVENTS.ROADMAP_UPDATED, {
      roadmapId,
      incrementStage: 1,
      incrementCourse: data.courseIds?.length || 0,
    });

    return roadmap;
  }

  async searchRoadmaps(query?: string, filters?: any) {
    return await roadmapCatalogRepo.searchRoadmaps(query, filters);
  }
}

export const roadmapService = new RoadmapService();
