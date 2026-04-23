import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as roadmapController from './roadmap.controller';

const router = Router();

// Public / Read-only endpoints
router.get('/search', roadmapController.searchRoadmaps);
router.get('/:id', roadmapController.getRoadmap);

// Strict protected endpoints for modification
router.use(requireAuth);
router.use(requireRole(['admin', 'creator']));

router.post('/', roadmapController.createRoadmap);
router.put('/:id', roadmapController.updateRoadmap);
router.delete('/:id', roadmapController.deleteRoadmap);

// Roadmap Stages
router.post('/:id/stages', roadmapController.addStage);

export default router;
