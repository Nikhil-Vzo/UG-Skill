import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '../components/loaders/Skeleton';
import { Button } from '../components/ui/Button';
import { AlertCircle, Download, ExternalLink, Award, CheckCircle } from 'lucide-react';
import api from '../lib/api';

interface Certificate {
  id: string;
  courseTitle: string;
  studentName: string;
  issuedAt: string;
  credentialId: string;
  instructorName?: string;
  courseId?: string;
  qrCodeUrl?: string;
  verifyUrl?: string;
}

export const CertificateViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: cert, isLoading, error } = useQuery<Certificate>({
    queryKey: ['certificate', id],
    queryFn: async () => {
      const res = await api.get(`/lms/certificates/${id}`);
      return res.data.data ?? res.data;
    },
    enabled: !!id,
    retry: 1,
  });

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Skeleton variant="rectangular" height={500} />
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Skeleton variant="rectangular" height={44} width="160px" />
          <Skeleton variant="rectangular" height={44} width="160px" />
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <AlertCircle size={40} style={{ color: 'var(--error)', opacity: 0.6 }} />
        <h2 style={{ color: 'var(--text-high)', margin: 0 }}>Certificate Not Found</h2>
        <p style={{ color: 'var(--text-low)', margin: 0 }}>This certificate doesn't exist or you don't have access to view it.</p>
        <Button variant="outline" onClick={() => navigate('/app')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Certificate Card */}
      <div
        className="glass-panel"
        style={{
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--surface-well) 0%, var(--surface-highest) 100%)',
          border: '2px solid var(--primary-glow)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative corner accents */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 60, height: 60, borderTop: '4px solid var(--primary-glow)', borderLeft: '4px solid var(--primary-glow)', opacity: 0.5 }}></div>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, borderTop: '4px solid var(--primary-glow)', borderRight: '4px solid var(--primary-glow)', opacity: 0.5 }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 60, height: 60, borderBottom: '4px solid var(--primary-glow)', borderLeft: '4px solid var(--primary-glow)', opacity: 0.5 }}></div>
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 60, height: 60, borderBottom: '4px solid var(--primary-glow)', borderRight: '4px solid var(--primary-glow)', opacity: 0.5 }}></div>

        {/* Platform badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-glow)', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          <Award size={20} />
          UGSkill Platform
        </div>

        {/* Title */}
        <div>
          <p style={{ margin: '0 0 0.75rem', color: 'var(--text-low)', fontSize: '0.9375rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>This is to certify that</p>
          <h1 style={{ margin: '0 0 0.25rem', color: 'var(--text-high)', fontSize: '2.25rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{cert.studentName}</h1>
          <p style={{ margin: 0, color: 'var(--text-low)', fontSize: '0.9375rem' }}>has successfully completed the course</p>
        </div>

        {/* Course name */}
        <div style={{ padding: '1rem 2rem', border: '1px solid var(--primary-glow)', background: 'var(--primary-low)' }}>
          <h2 style={{ margin: 0, color: 'var(--primary-glow)', fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>{cert.courseTitle}</h2>
        </div>

        {/* Date and instructor */}
        <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 0.25rem', color: 'var(--text-lowest)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Date of Issue</p>
            <p style={{ margin: 0, color: 'var(--text-high)', fontWeight: 600 }}>{formatDate(cert.issuedAt)}</p>
          </div>
          {cert.instructorName && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.25rem', color: 'var(--text-lowest)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Certified By</p>
              <p style={{ margin: 0, color: 'var(--text-high)', fontWeight: 600 }}>{cert.instructorName}</p>
            </div>
          )}
        </div>

        {/* Verified badge + Credential ID */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem' }}>
            <CheckCircle size={16} /> Verified Certificate
          </div>
          <p style={{ margin: 0, color: 'var(--text-lowest)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            Credential ID: {cert.credentialId}
          </p>
        </div>

        {/* QR code placeholder */}
        {cert.qrCodeUrl ? (
          <img src={cert.qrCodeUrl} alt="QR Verification Code" style={{ width: 80, height: 80 }} />
        ) : (
          <div style={{ width: 80, height: 80, background: 'var(--surface-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-lowest)', fontSize: '0.625rem', textAlign: 'center' }}>
            QR Verification
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button variant="primary" leftIcon={<Download size={16} />} onClick={() => window.print()}>
          Download PDF
        </Button>
        {cert.verifyUrl && (
          <Button
            variant="outline"
            leftIcon={<ExternalLink size={16} />}
            onClick={() => window.open(cert.verifyUrl, '_blank')}
          >
            Verify Online
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate('/app')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};
