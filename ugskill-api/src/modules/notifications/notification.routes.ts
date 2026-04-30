import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { notificationsController } from './notification.controller';

const router = Router();

router.use(requireAuth);

router.get('/', notificationsController.list);
router.patch('/read-all', notificationsController.markAll);
router.patch('/:id/read', notificationsController.markOne);

export const notificationRoutes = router;
