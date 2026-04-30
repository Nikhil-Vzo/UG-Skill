import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { leaderboardsController } from './leaderboard.controller';

const router = Router();

router.use(requireAuth);

router.get('/me', leaderboardsController.myRank);
router.get('/', leaderboardsController.list);

export const leaderboardRoutes = router;
