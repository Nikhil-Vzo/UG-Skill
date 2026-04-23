import { Router } from 'express';
import * as batchController from './batch.controller';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createBatchSchema,
  updateBatchSchema,
  batchParamsSchema,
  addMembersSchema,
  removeMemberSchema,
} from './batch.schemas';

const router = Router();

// All batch routes require authentication
router.use(requireAuth);

// List (any authenticated user can see batches)
router.get('/', batchController.listBatches);
router.get('/:id', validate(batchParamsSchema), batchController.getBatch);

// Admin-only operations
router.post('/', requireRole(['admin']), validate(createBatchSchema), batchController.createBatch);
router.put('/:id', requireRole(['admin']), validate(updateBatchSchema), batchController.updateBatch);
router.delete('/:id', requireRole(['admin']), validate(batchParamsSchema), batchController.deleteBatch);

// Member management (admin only)
router.post('/:id/members', requireRole(['admin']), validate(addMembersSchema), batchController.addMembers);
router.delete('/:id/members/:userId', requireRole(['admin']), validate(removeMemberSchema), batchController.removeMember);

export default router;
