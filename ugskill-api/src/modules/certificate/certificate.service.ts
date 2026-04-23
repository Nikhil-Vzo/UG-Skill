import { certificateRepository } from './certificate.repository';
import { progressRepository } from '../progress/progress.repository';
import { AppError } from '../../lib/errors';

export class CertificateService {
  async generateCertificate(studentId: string, courseId: string, courseTitle: string) {
    // 1. Verify 100% progress
    const progress = await progressRepository.getProgressSummary(studentId, courseId);
    
    if (!progress || !progress.totalLectures || progress.lecturesCompleted === null || progress.lecturesCompleted < progress.totalLectures) {
      throw new AppError('Cannot generate certificate. Course is not 100% complete.', 403);
    }

    // 2. Issue Certificate (Mock PDF URL generation for now)
    const { existing, cert } = await certificateRepository.issueCertificate({
      studentId,
      certType: 'course',
      referenceId: courseId,
      referenceTitle: courseTitle,
      pdfUrl: `https://ugskill.com/certs/${studentId}_${courseId}.pdf`,
    });

    return {
      message: existing ? 'Certificate already generated' : 'Certificate successfully generated',
      certificate: cert,
    };
  }

  async verify(uuid: string) {
    const cert = await certificateRepository.verifyCertificate(uuid);
    if (!cert) {
      throw new AppError('Certificate not found or invalid', 404);
    }
    return cert;
  }
}

export const certificateService = new CertificateService();
