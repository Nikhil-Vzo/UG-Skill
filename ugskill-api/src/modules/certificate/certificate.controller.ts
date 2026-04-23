import { Request, Response, NextFunction } from 'express';
import { certificateService } from './certificate.service';
import { successResponse } from '../../lib/response';

export class CertificateController {
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const { courseId, courseTitle } = req.body;

      const result = await certificateService.generateCertificate(studentId, courseId, courseTitle);

      res.status(201).json(successResponse(result.message, result.certificate));
    } catch (error) {
      next(error);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const verificationUuid = req.params.verificationUuid as string;

      const cert = await certificateService.verify(verificationUuid);

      res.status(200).json(successResponse('Certificate is valid', cert));
    } catch (error) {
      next(error);
    }
  }
}

export const certificateController = new CertificateController();
