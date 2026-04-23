import { Router } from 'express';
import * as inviteController from './invite.controller';
import { requireAuth, requireRole } from '../../middleware/auth';

const router = Router();

// Admin-only: generate an invite link for a new HR/company user
router.post(
  '/admin/invites',
  requireAuth,
  requireRole(['admin']),
  inviteController.generateInvite
);

// Public: validate invite token before rendering the accept form
router.get('/auth/invite/:token', inviteController.validateInvite);

// Public: accept invite and create the account
router.post('/auth/invite/accept', inviteController.acceptInvite);

export default router;
