import { Router } from 'express';
import * as userController from './user.controller';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { updateMeSchema, getUserParamsSchema, listUsersQuerySchema } from './user.schemas';

const router = Router();

// All user routes require authentication
router.use(requireAuth);

// Self-service routes
router.get('/me', userController.getMe);
router.put('/me', validate(updateMeSchema), userController.updateMe);

// Admin routes
router.get('/', requireRole(['admin']), validate(listUsersQuerySchema), userController.listUsers);
router.get('/:id', requireRole(['admin']), validate(getUserParamsSchema), userController.getUser);
router.delete('/:id', requireRole(['admin']), validate(getUserParamsSchema), userController.deleteUser);

export default router;
