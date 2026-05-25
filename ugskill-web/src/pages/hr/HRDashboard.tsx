import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase, Users, CalendarCheck, LogOut, Clock, CheckCircle, XCircle,
  ChevronRight, FileText, Plus, Video, Copy, Link, ExternalLink, X, Trash2,
  Calendar, UserCheck, UserCog, AlarmClock, ClipboardList, Shield
} from 'lucide-react';
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

// ── Schedule Interview Modal ──────────────────────────────────────
interface ScheduleModalProps {
  applicant: any;
  onClose: () => void;
  onScheduled: (session: any) => void;
}

const ScheduleInterviewModal: React.FC<ScheduleModalProps> = ({ applicant, onClose, onScheduled }) => {
  const [scheduledAt, setScheduledAt] = useState('');
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundLabel, setRoundLabel] = useState('Technical Round 1');

  // Minimum datetime = now + 5 min
  const minDt = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/placements/sessions', {
        studentId: applicant.studentId,
        sessionType: 'live_interview',
        driveId: applicant.driveId,
        companyId: applicant.drive?.companyId || undefined,
        roundNumber,
        roundLabel,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      return res.data.data || res.data;
    },
    onSuccess: (session) => onScheduled(session),
    onError: (err: any) => {
      alert('Failed to schedule interview: ' + (err?.response?.data?.error?.message || err.message));
    },
  });

  return (
    <div className="hr-modal-overlay" onClick={onClose}>
      <div
        className="hr-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 520 }}
      >
        {/* Header */}
        <div className="hr-modal-header">
          <div>
            <div className="hr-modal-title-area">
              <div className="hr-modal-icon-wrap" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                <Calendar size={16} color="#fff" />
              </div>
              <h2 className="hr-modal-title">Schedule Interview</h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
              Candidate: <strong style={{ color: '#f8fafc' }}>{applicant.student?.fullName}</strong>
              {applicant.drive?.name && (
                <span> · {applicant.drive.name}</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="hr-modal-close"><X size={20} /></button>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem 0' }}>
          {/* Date & Time */}
          <div>
            <label style={labelStyle}>
              <AlarmClock size={14} style={{ marginRight: '0.375rem' }} />
              Interview Date & Time <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="datetime-local"
              min={minDt}
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              style={inputStyle}
              required
            />
            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.35rem' }}>
              Candidate's local timezone is assumed. Communicate the exact time separately.
            </div>
          </div>

          {/* Round Number */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>
                <ClipboardList size={14} style={{ marginRight: '0.375rem' }} />
                Round #
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={roundNumber}
                onChange={e => setRoundNumber(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Round Label</label>
              <input
                type="text"
                value={roundLabel}
                onChange={e => setRoundLabel(e.target.value)}
                placeholder="e.g. Technical Round 1"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Role differentiation callout */}
          <div style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 10,
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 700, color: '#a5b4fc' }}>
              <Shield size={14} /> Role Differentiation — same link, different experience
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={roleCardStyle('#22c55e')}>
                <UserCog size={16} color="#22c55e" />
                <div>
                  <div style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.8rem' }}>Interviewer (HR)</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                    Sees candidate profile, evaluation sliders, AI suggested questions, and submits the final grade.
                  </div>
                </div>
              </div>
              <div style={roleCardStyle('#818cf8')}>
                <UserCheck size={16} color="#818cf8" />
                <div>
                  <div style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.8rem' }}>Candidate (Student)</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                    Sees interview guidelines, AI proctor status, and a chat panel. Cannot see HR's grading.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="hr-modal-actions">
          <button onClick={onClose} className="hr-modal-btn secondary">Cancel</button>
          <button
            onClick={() => scheduleMutation.mutate()}
            disabled={scheduleMutation.isPending || !scheduledAt}
            className="hr-modal-btn primary"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', opacity: scheduledAt ? 1 : 0.5 }}
          >
            {scheduleMutation.isPending ? 'Scheduling…' : (
              <><Calendar size={15} /> Schedule Interview</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Dual Link Modal shown after scheduling ─────────────────────────
interface DualLinkModalProps {
  session: any;
  onClose: () => void;
}

const DualLinkModal: React.FC<DualLinkModalProps> = ({ session, onClose }) => {
  const [copiedHR, setCopiedHR] = useState(false);
  const [copiedCandidate, setCopiedCandidate] = useState(false);

  const roomUrl = `${window.location.origin}/app/placements/interview/${session.id}`;

  const copyHR = () => {
    navigator.clipboard.writeText(roomUrl).then(() => {
      setCopiedHR(true);
      setTimeout(() => setCopiedHR(false), 2000);
    });
  };

  const copyCandidate = () => {
    navigator.clipboard.writeText(roomUrl).then(() => {
      setCopiedCandidate(true);
      setTimeout(() => setCopiedCandidate(false), 2000);
    });
  };

  const scheduledLabel = session.scheduledAt
    ? new Date(session.scheduledAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : 'Immediately';

  return (
    <div className="hr-modal-overlay">
      <div className="hr-modal" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="hr-modal-header">
          <div>
            <div className="hr-modal-title-area">
              <div className="hr-modal-icon-wrap" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                <CheckCircle size={16} color="#fff" />
              </div>
              <h2 className="hr-modal-title">Interview Scheduled!</h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
              Scheduled for <strong style={{ color: '#f8fafc' }}>{scheduledLabel}</strong>
              {session.roundLabel && <span> · {session.roundLabel}</span>}
            </p>
          </div>
          <button onClick={onClose} className="hr-modal-close"><X size={20} /></button>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem 0' }}>
          {/* Interviewer link */}
          <div style={linkCardStyle('#22c55e')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <UserCog size={16} color="#22c55e" />
              <span style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.875rem' }}>Your Link (Interviewer)</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', background: 'rgba(34,197,94,0.12)', color: '#22c55e', padding: '0.15rem 0.5rem', borderRadius: 20, fontWeight: 600 }}>HR / Admin</span>
            </div>
            <div style={linkUrlStyle}>{roomUrl}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', margin: '0.5rem 0' }}>
              You'll see the candidate's profile, evaluation sliders, and AI question guide.
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={copyHR}
                className={`hr-modal-btn secondary ${copiedHR ? 'copied' : ''}`}
                style={{ flex: 1, fontSize: '0.8rem' }}
              >
                <Copy size={13} /> {copiedHR ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => window.open(roomUrl, '_blank')}
                className="hr-modal-btn primary"
                style={{ flex: 1, fontSize: '0.8rem' }}
              >
                <ExternalLink size={13} /> Open Room
              </button>
            </div>
          </div>

          {/* Candidate link */}
          <div style={linkCardStyle('#818cf8')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <UserCheck size={16} color="#818cf8" />
              <span style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.875rem' }}>Candidate Link (Share This)</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', background: 'rgba(129,140,248,0.12)', color: '#818cf8', padding: '0.15rem 0.5rem', borderRadius: 20, fontWeight: 600 }}>Student</span>
            </div>
            <div style={linkUrlStyle}>{roomUrl}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', margin: '0.5rem 0' }}>
              Candidate will see interview guidelines and AI proctor panel. Cannot see your grading.
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={copyCandidate}
                className={`hr-modal-btn secondary ${copiedCandidate ? 'copied' : ''}`}
                style={{ flex: 1, fontSize: '0.8rem' }}
              >
                <Copy size={13} /> {copiedCandidate ? 'Copied!' : 'Copy & Share'}
              </button>
              <button
                onClick={() => {
                  const subject = encodeURIComponent(`Interview Scheduled – ${session.driveName || 'Placement Drive'}`);
                  const body = encodeURIComponent(
                    `Dear Candidate,\n\nYour interview has been scheduled for ${scheduledLabel}.\n\nJoin here: ${roomUrl}\n\nBest regards,\nHR Team`
                  );
                  window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                }}
                className="hr-modal-btn primary"
                style={{ flex: 1, fontSize: '0.8rem' }}
              >
                <Link size={13} /> Draft Email
              </button>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569', textAlign: 'center' }}>
            The candidate will also see this interview session automatically in their Placement Hub.
          </p>
        </div>

        <div className="hr-modal-actions">
          <button onClick={onClose} className="hr-modal-btn primary" style={{ width: '100%' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Shared mini-styles ─────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', fontSize: '0.8125rem',
  fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.625rem 0.875rem',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, color: '#f8fafc', fontSize: '0.875rem', outline: 'none',
  boxSizing: 'border-box',
};
const roleCardStyle = (accent: string): React.CSSProperties => ({
  display: 'flex', gap: '0.625rem', padding: '0.75rem',
  background: `${accent}08`, border: `1px solid ${accent}20`,
  borderRadius: 8,
});
const linkCardStyle = (accent: string): React.CSSProperties => ({
  padding: '1rem', background: `${accent}08`,
  border: `1px solid ${accent}20`, borderRadius: 10,
});
const linkUrlStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 6, padding: '0.5rem 0.75rem',
  fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8',
  wordBreak: 'break-all', lineHeight: 1.5,
};

// ── Main HR Dashboard ─────────────────────────────────────────────
export const HRDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [schedulingApplicant, setSchedulingApplicant] = useState<any | null>(null);
  const [scheduledSession, setScheduledSession] = useState<any | null>(null);
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

  const handleLogout = () => {
    logout('');
    navigate('/hr');
  };

  const activeInterviewSessions = activeSessions.filter((session: any) => session.sessionType === 'live_interview');

  const stats = [
    { label: 'Active Drives',    value: displayedDrives.length,                                              icon: <Briefcase size={20} />,    color: '#2dd4bf' },
    { label: 'Total Applicants', value: applicants.length,                                                    icon: <Users size={20} />,        color: '#818cf8' },
    { label: 'Shortlisted',      value: applicants.filter((a: any) => a.status === 'shortlisted').length,     icon: <CheckCircle size={20} />,  color: '#22c55e' },
    { label: 'Active Rooms',     value: activeInterviewSessions.length,                                       icon: <CalendarCheck size={20} />, color: '#f59e0b' },
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
          <button onClick={() => navigate('/app/admin/placements')} className="hr-btn-create">
            <Plus size={16} /> Create New Drive
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.fullName}</div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="hr-btn-logout">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <main className="hr-main">
        {/* Welcome */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 className="hr-welcome-title">Welcome back, {user?.fullName?.split(' ')[0]}</h1>
          <p className="hr-welcome-subtitle">Here's your recruitment overview for today.</p>
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
                    <div className="hr-avatar">{a.student?.fullName?.[0] || '?'}</div>
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

              {/* ── Schedule Interview (replaces instant room creation) ── */}
              {selectedApplicant.status === 'interview' && (
                <div className="hr-interview-action-panel">
                  {selectedActiveSession ? (
                    <>
                      <div style={{
                        display: 'flex', gap: '0.5rem', alignItems: 'center',
                        padding: '0.75rem', borderRadius: 8,
                        background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
                        marginBottom: '0.75rem', fontSize: '0.8125rem', color: '#22c55e'
                      }}>
                        <CalendarCheck size={14} />
                        <span>
                          {selectedActiveSession.scheduledAt
                            ? `Scheduled: ${new Date(selectedActiveSession.scheduledAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`
                            : 'Interview room ready'}
                          {selectedActiveSession.roundLabel && ` · ${selectedActiveSession.roundLabel}`}
                        </span>
                      </div>

                      <button
                        onClick={() => window.open(`/app/placements/interview/${selectedActiveSession.id}`, '_blank')}
                        className="hr-btn-video-room"
                      >
                        <Video size={18} />
                        {selectedActiveSession.status === 'in_progress' ? 'Rejoin Live Room' : 'Open Interview Room'}
                      </button>

                      <button
                        onClick={() => {
                          const roomUrl = `${window.location.origin}/app/placements/interview/${selectedActiveSession.id}`;
                          navigator.clipboard.writeText(roomUrl);
                        }}
                        className="hr-btn-copy-link"
                      >
                        <Copy size={14} /> Copy Candidate Link
                      </button>

                      <p className="hr-interview-status-msg">
                        {selectedActiveSession.status === 'in_progress' ? '🔴 Live now' : '⏳ Scheduled'} · Candidate can see this in Placement Hub.
                      </p>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedApplicant(null);
                        setSchedulingApplicant(selectedApplicant);
                      }}
                      className="hr-btn-video-room"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                    >
                      <Calendar size={18} /> Schedule Interview
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {schedulingApplicant && (
        <ScheduleInterviewModal
          applicant={schedulingApplicant}
          onClose={() => setSchedulingApplicant(null)}
          onScheduled={(session) => {
            setSchedulingApplicant(null);
            setScheduledSession(session);
            queryClient.invalidateQueries({ queryKey: ['hr-applicants'] });
            queryClient.invalidateQueries({ queryKey: ['hr-active-interview-sessions'] });
          }}
        />
      )}

      {/* Dual Link Result Modal */}
      {scheduledSession && (
        <DualLinkModal
          session={scheduledSession}
          onClose={() => setScheduledSession(null)}
        />
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
              <button onClick={() => setDriveToDelete(null)} className="hr-modal-close"><X size={20} /></button>
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
              <button onClick={() => setDriveToDelete(null)} className="hr-modal-btn secondary">Cancel</button>
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
