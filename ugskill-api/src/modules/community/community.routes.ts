import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { communityController } from './community.controller';

const router = Router();

router.use(requireAuth);

router.get('/posts', communityController.listPosts);
router.post('/posts', communityController.createPost);
router.post('/posts/:id/like', communityController.likePost);
router.post('/posts/:id/bookmark', communityController.bookmarkPost);
router.get('/posts/:id/replies', communityController.getReplies);
router.post('/posts/:id/replies', communityController.addReply);

export const communityRoutes = router;
