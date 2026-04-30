import { Router } from 'express';
import { certificateController } from './certificate.controller';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { generateCertificateSchema, verifyCertificateSchema } from './certificate.schemas';

const router = Router();

router.post(
  '/generate',
  requireAuth,
  validate(generateCertificateSchema),
  certificateController.generate.bind(certificateController)
);

router.get(
  '/:id',
  requireAuth,
  certificateController.getById.bind(certificateController)
);

router.get(
  '/verify/:verificationUuid',
  validate(verifyCertificateSchema),
  certificateController.verify.bind(certificateController)
);

export const certificateRoutes = router;
