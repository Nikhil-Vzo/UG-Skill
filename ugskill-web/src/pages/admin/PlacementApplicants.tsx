import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, AlertCircle, FileText, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

export const PlacementApplicants: React.FC = () => {
  const { driveId } = useParams();
  const navigate = useNavigate();

  const { data: applicants, isLoading, isError } = useQuery({
    queryKey: ['placementApplicants', driveId],
    queryFn: async () => {
      const res = await api.get(`/admin/placements/${driveId}/applicants`);
      return res.data.data ?? res.data;
    },
    enabled: !!driveId,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '2rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AlertCircle size={20} />
        <span>Failed to load applicants.</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft size={16} />}>
          Back
        </Button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', margin: 0 }}>Applicants</h1>
      </div>

      <div className="surface-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--surface-well)', borderBottom: '1px solid var(--surface-highest)' }}>
              <tr>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-low)', fontSize: '0.875rem' }}>Applicant Name</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-low)', fontSize: '0.875rem' }}>Email</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-low)', fontSize: '0.875rem' }}>Branch</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-low)', fontSize: '0.875rem' }}>CGPA</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-low)', fontSize: '0.875rem' }}>Resume</th>
              </tr>
            </thead>
            <tbody>
              {applicants?.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-low)' }}>
                    No applicants found.
                  </td>
                </tr>
              ) : (
                applicants?.map((applicant: any) => (
                  <tr key={applicant.id || applicant._id} style={{ borderBottom: '1px solid var(--surface-highest)' }}>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-well)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={16} color="var(--text-low)" />
                      </div>
                      <span style={{ fontWeight: 500 }}>{applicant.name || applicant.user?.name || 'Unknown'}</span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-low)' }}>{applicant.email || applicant.user?.email || '-'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-low)' }}>{applicant.branch || applicant.user?.branch || '-'}</td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-high)' }}>{applicant.cgpa || applicant.user?.cgpa || '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      {(applicant.resumeUrl || applicant.user?.resumeUrl) ? (
                        <a 
                          href={applicant.resumeUrl || applicant.user?.resumeUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}
                        >
                          <FileText size={16} /> View
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-lowest)', fontSize: '0.875rem' }}>Not provided</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
