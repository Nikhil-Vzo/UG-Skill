import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Users, CalendarCheck, LogOut, TrendingUp, Clock, CheckCircle, XCircle, ChevronRight, FileText, Plus, Video, Copy, Link, ExternalLink, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import api from '../../lib/api';
import './HRDashboard.css';

const statusColor: Record<string, string> = {
  shortlisted: '#22c55e',
  rejected:    '#ef4444',
  pending:     '#f59e0b',
  interview:   '#818cf8',
  selected:    '#10b981',
};

export const HRDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [createdSession, setCreatedSession] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [driveToDelete, setDriveToDelete] = useState<{ id: string, name: string } | null>(null);

  const deleteDriveMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/placements/drives/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-drives'] });
      queryClient.invalidateQueries({ queryKey: ['placement-drives'] });
      queryClient.invalidateQueries({ queryKey: ['placement-drives-db'] });
      setDriveToDelete(null);
    },
    onError: (err: any) => {
      alert('Failed to delete placement drive: ' + (err?.response?.data?.error?.message || err.message));
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => 
      api.patch(`/placements/registrations/${id}`, { status }),
    onSuccess: (_response, vars) => {
      queryClient.invalidateQueries({ queryKey: ['hr-applicants'] });
      setSelectedApplicant((current: any) => current ? { ...current, status: vars.status } : current);
    }
  });

  const { data: drives = [] } = useQuery({
    queryKey: ['hr-drives'],
    queryFn: () => api.get('/placements/drives?limit=100').then(r => r.data.data || []),
  });

  const displayedDrives = drives.filter((d: any) =>
    user?.roles?.some((role: string) => ['admin', 'creator', 'super_admin'].includes(role)) ||
    d.createdBy === user?.id
  );

  const { data: applicants = [] } = useQuery({
    queryKey: ['hr-applicants'],
    queryFn: () => api.get('/placements/registrations').then(r => r.data.data || []),
  });

  const { data: activeSessions = [] } = useQuery({
    queryKey: ['hr-active-interview-sessions'],
    queryFn: () => api.get('/placements/sessions?active=true').then(r => r.data.data || []),
    refetchInterval: 15000,
  });

  const startInterviewMutation = useMutation({
    mutationFn: async (applicant: any) => {
      const res = await api.post('/placements/sessions', {
        studentId: applicant.studentId,
        sessionType: 'live_interview',
        driveId: applicant.driveId,
        companyId: applicant.drive?.companyId || undefined,
        roundNumber: 1
      });
      return res.data.data || res.data;
    },
    onSuccess: (session) => {
      setCreatedSession(session);
      queryClient.invalidateQueries({ queryKey: ['hr-applicants'] });
      queryClient.invalidateQueries({ queryKey: ['hr-active-interview-sessions'] });
    },
    onError: (err: any) => {
      alert('Failed to create session: ' + (err?.response?.data?.error?.message || err.message));
    }
  });

  const copyLink = (sessionId: string) => {
    const link = `${window.location.origin}/app/placements/interview/${sessionId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleLogout = () => {
    logout('');
    navigate('/hr');
  };

  const activeInterviewSessions = activeSessions.filter((session: any) => session.sessionType === 'live_interview');

  const stats = [
    { label: 'Active Drives',    value: displayedDrives.length,                            icon: <Briefcase size={20} />,  color: '#2dd4bf' },
    { label: 'Total Applicants', value: applicants.length,                                  icon: <Users size={20} />,      color: '#818cf8' },
    { label: 'Shortlisted',      value: applicants.filter((a: any) => a.status === 'shortlisted').length, icon: <CheckCircle size={20} />, color: '#22c55e' },
    { label: 'Active Rooms',     value: activeInterviewSessions.length,                     icon: <CalendarCheck size={20} />, color: '#f59e0b' },
  ];

  const selectedActiveSession = selectedApplicant
    ? activeInterviewSessions.find((session: any) =>
        session.studentId === selectedApplicant.studentId &&
        session.driveId === selectedApplicant.driveId &&
        ['scheduled', 'in_progress'].includes(session.status)
      )
    : null;

  return (
    <div className="hr-portal">
      {/* Top bar */}
      <header className="hr-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="hr-header-logo-wrap">
            <Briefcase size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>UGSkill HR Portal</div>
            <div style={{ fontSize: '0.7rem', color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recruiter Dashboard</div>
          </div>
        </div>

        <div className="hr-header-actions">
          <button
            onClick={() => navigate('/app/admin/placements')}
            className="hr-btn-create"
          >
            <Plus size={16} /> Create New Drive
          </button>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.fullName}</div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="hr-btn-logout"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <main className="hr-main">
        {/* Welcome */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 className="hr-welcome-title">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="hr-welcome-subtitle">
            Here's your recruitment overview for today.
          </p>
        </div>

        {/* Stat cards */}
        <div className="hr-stats-grid">
          {stats.map(s => (
            <div key={s.label} className="hr-stat-card" style={{ '--accent-color': s.color } as React.CSSProperties}>
              <div className="hr-stat-header">
                <span className="hr-stat-label">{s.label}</span>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div className="hr-stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="hr-grid-layout">
          {/* Applicant pipeline */}
          <div className="hr-panel">
            <div className="hr-panel-header">
              <h2 className="hr-panel-title">Recent Applicants</h2>
              <span className="hr-panel-link">View all →</span>
            </div>

            {applicants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#334155' }}>
                <Users size={32} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: '0.875rem' }}>No applicants yet.</p>
                <p style={{ fontSize: '0.8125rem', marginTop: '0.375rem' }}>Post a placement drive to start receiving applications.</p>
              </div>
            ) : (
              <div className="hr-applicant-list">
                {applicants.slice(0, 8).map((a: any) => (
                  <div key={a.id} onClick={() => setSelectedApplicant(a)} className="hr-applicant-item">
                    <div className="hr-avatar">
                      {a.student?.fullName?.[0] || '?'}
                    </div>
                    <div className="hr-applicant-info">
                      <div className="hr-applicant-name">{a.student?.fullName}</div>
                      <div className="hr-applicant-drive">{a.drive?.name}</div>
                    </div>
                    <span className="hr-status-badge" style={{ background: `${statusColor[a.status] || '#818cf8'}18`, color: statusColor[a.status] || '#818cf8' }}>
                      {a.status}
                    </span>
                    <ChevronRight size={14} className="hr-chevron" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active drives */}
          <div className="hr-panel">
            <div className="hr-panel-header">
              <h2 className="hr-panel-title">Your Drives</h2>
            </div>

            {displayedDrives.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#334155' }}>
                <Briefcase size={32} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: '0.875rem' }}>No placement drives yet.</p>
                <p style={{ fontSize: '0.8125rem', marginTop: '0.375rem' }}>Contact the UGSkill admin team to set up your first drive.</p>
              </div>
            ) : (
              <div className="hr-drive-list">
                {displayedDrives.map((d: any) => (
                  <div key={d.id} className="hr-drive-item">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="hr-drive-name">{d.name}</div>
                      <div className="hr-drive-meta">
                        <span className="hr-drive-meta-item"><Users size={12} /> {d.applicationCount || 0} applicants</span>
                        <span className="hr-drive-meta-item"><Clock size={12} /> Closes {d.registrationDeadline ? new Date(d.registrationDeadline).toLocaleDateString() : 'TBD'}</span>
                      </div>
                    </div>
                    {(user?.roles?.includes('admin') || user?.roles?.includes('creator') || user?.roles?.includes('super_admin') || d.createdBy === user?.id) && (
                      <button
                        onClick={() => setDriveToDelete({ id: d.id, name: d.name })}
                        title="Delete Placement Drive"
                        className="hr-btn-delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Applicant Side-Panel */}
      {selectedApplicant && (
        <div className="hr-backdrop" onClick={() => setSelectedApplicant(null)}>
          <div className="hr-side-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 className="hr-side-title">{selectedApplicant.student?.fullName}</h2>
                <div className="hr-side-subtitle">Applied for: <span style={{ color: '#f8fafc', fontWeight: 500 }}>{selectedApplicant.drive?.name}</span></div>
              </div>
              <button onClick={() => setSelectedApplicant(null)} className="hr-side-close"><X size={24} /></button>
            </div>
            
            {/* Status Badge */}
            <div className="hr-side-status-section">
              <span className="hr-status-badge" style={{ background: `${statusColor[selectedApplicant.status] || '#818cf8'}25`, color: statusColor[selectedApplicant.status] || '#818cf8', padding: '0.375rem 0.875rem' }}>
                Current Status: {selectedApplicant.status}
              </span>
            </div>

            {/* Resume Action */}
            {selectedApplicant.resumeUrl ? (
              <button onClick={() => window.open(selectedApplicant.resumeUrl, '_blank')} className="hr-resume-btn">
                <FileText size={18} /> View Resume
              </button>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 8, color: '#64748b', fontSize: '0.875rem' }}>No resume attached to this application</div>
            )}

            {/* Pipeline Actions */}
            <div className="hr-action-group">
              <h3 className="hr-action-title">Update Pipeline Status</h3>
              <button 
                onClick={() => updateStatusMutation.mutate({ id: selectedApplicant.id, status: 'shortlisted' })}
                disabled={updateStatusMutation.isPending || selectedApplicant.status === 'shortlisted'}
                className="hr-btn-pipeline shortlist"
              >
                {updateStatusMutation.isPending && selectedApplicant.status !== 'shortlisted' ? 'Updating...' : 'Shortlist Candidate'}
              </button>
              <button 
                onClick={() => updateStatusMutation.mutate({ id: selectedApplicant.id, status: 'interview' })}
                disabled={updateStatusMutation.isPending || selectedApplicant.status === 'interview'}
                className="hr-btn-pipeline interview"
              >
                Move to Interview Stage
              </button>
              <button 
                onClick={() => updateStatusMutation.mutate({ id: selectedApplicant.id, status: 'rejected' })}
                disabled={updateStatusMutation.isPending || selectedApplicant.status === 'rejected'}
                className="hr-btn-pipeline reject"
              >
                Reject Candidate
              </button>

              {selectedApplicant.status === 'interview' && (
                <div className="hr-interview-action-panel">
                  <button
                    onClick={() => selectedActiveSession
                      ? window.open(`/app/placements/interview/${selectedActiveSession.id}`, '_blank')
                      : startInterviewMutation.mutate(selectedApplicant)
                    }
                    disabled={startInterviewMutation.isPending}
                    className="hr-btn-video-room"
                  >
                    <Video size={18} />
                    {startInterviewMutation.isPending
                      ? 'Creating Room...'
                      : selectedActiveSession
                        ? 'Open Existing Room'
                        : 'Create Interview Room'}
                  </button>
                  {selectedActiveSession && (
                    <>
                      <button
                        onClick={() => copyLink(selectedActiveSession.id)}
                        className={`hr-btn-copy-link ${copiedLink ? 'copied' : ''}`}
                      >
                        <Copy size={14} /> {copiedLink ? 'Copied!' : 'Copy Link'}
                      </button>
                      <p className="hr-interview-status-msg">
                        Room status: {selectedActiveSession.status === 'in_progress' ? '🔴 Live now' : '⏳ Scheduled'} · Candidate can see this in Placement Hub.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Session Created Invite Modal ── */}
      {createdSession && (
        <div className="hr-modal-overlay">
          <div className="hr-modal">
            <div className="hr-modal-header">
              <div>
                <div className="hr-modal-title-area">
                  <div className="hr-modal-icon-wrap">
                    <Video size={16} color="#fff" />
                  </div>
                  <h2 className="hr-modal-title">Interview Session Created</h2>
                </div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>Room status: Scheduled</p>
              </div>
              <button onClick={() => setCreatedSession(null)} className="hr-modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="hr-modal-link-box">
              <div className="hr-modal-link-label">Student Join Link</div>
              <div className="hr-modal-link-url">
                {`${window.location.origin}/app/placements/interview/${createdSession.id}`}
              </div>
            </div>

            <div className="hr-modal-actions">
              <button
                onClick={() => copyLink(createdSession.id)}
                className={`hr-modal-btn secondary ${copiedLink ? 'copied' : ''}`}
              >
                <Copy size={15} /> {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => window.open(`/app/placements/interview/${createdSession.id}`, '_blank')}
                className="hr-modal-btn primary"
              >
                <ExternalLink size={15} /> Open Room
              </button>
            </div>
            <p style={{ margin: '1rem 0 0', fontSize: '0.75rem', color: '#475569', textAlign: 'center' }}>
              Candidate will see this room in Placement Hub automatically.
            </p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {driveToDelete && (
        <div className="hr-modal-overlay">
          <div className="hr-modal danger">
            <div className="hr-modal-header">
              <div>
                <div className="hr-modal-title-area">
                  <div className="hr-modal-icon-wrap danger">
                    <Trash2 size={16} />
                  </div>
                  <h2 className="hr-modal-title">Delete Placement Drive</h2>
                </div>
              </div>
              <button onClick={() => setDriveToDelete(null)} className="hr-modal-close">
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#94a3b8', lineHeight: '1.5' }}>
                Are you sure you want to delete the placement drive <strong style={{ color: '#f8fafc' }}>{driveToDelete.name}</strong>?
              </p>
              <div className="hr-modal-warning-box">
                <strong>Warning:</strong> This action cannot be undone. All registrations, scheduled interviews, live slot bookings, and group discussions associated with this drive will be permanently deleted.
              </div>
            </div>

            <div className="hr-modal-actions">
              <button
                onClick={() => setDriveToDelete(null)}
                className="hr-modal-btn secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteDriveMutation.mutate(driveToDelete.id)}
                disabled={deleteDriveMutation.isPending}
                className="hr-modal-btn danger"
              >
                {deleteDriveMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
