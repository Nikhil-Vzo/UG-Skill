import { db } from '../../config/postgres';
import { certificates } from '../../db/pg/schema/lms';
import { eq, and } from 'drizzle-orm';

export class CertificateRepository {
  async issueCertificate(data: {
    studentId: string;
    certType: string;
    referenceId: string;
    referenceTitle: string;
    pdfUrl?: string;
  }) {
    // Check if already issued
    const existing = await db
      .select()
      .from(certificates)
      .where(
        and(
          eq(certificates.studentId, data.studentId),
          eq(certificates.certType, data.certType),
          eq(certificates.referenceId, data.referenceId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return { existing: true, cert: existing[0] };
    }

    const [cert] = await db
      .insert(certificates)
      .values({
        studentId: data.studentId,
        certType: data.certType,
        referenceId: data.referenceId,
        referenceTitle: data.referenceTitle,
        pdfUrl: data.pdfUrl || null,
      })
      .returning();

    return { existing: false, cert };
  }

  async verifyCertificate(verificationUuid: string) {
    const [cert] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.verificationUuid, verificationUuid))
      .limit(1);
    
    return cert || null;
  }
}

export const certificateRepository = new CertificateRepository();
