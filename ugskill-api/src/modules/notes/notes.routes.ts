import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { notesController } from './notes.controller';

const router = Router();

router.use(requireAuth);

router.get('/', notesController.getNote);
router.post('/', notesController.upsertNote);

export const notesRoutes = router;
