import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Users, CalendarCheck, LogOut, TrendingUp, Clock, CheckCircle, XCircle, ChevronRight, FileText, Plus, Video, Copy, Link, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import api from '../../lib/api';

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
    queryFn: () => api.get('/placements/drives').then(r => r.data.data || []),
  });

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
    { label: 'Active Drives',    value: drives.length,                                     icon: <Briefcase size={20} />,  color: '#2dd4bf' },
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
    <div style={{ minHeight: '100vh', background: '#060b14', color: '#f0f9ff', fontFamily: 'Inter, sans-serif' }}>
      {/* Top bar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2.5rem', background: 'rgba(8,12,20,0.95)', borderBottom: '1px solid rgba(20,184,166,0.1)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #14b8a6, #0d9488)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Briefcase size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>UGSkill HR Portal</div>
            <div style={{ fontSize: '0.7rem', color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recruiter Dashboard</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button
            onClick={() => navigate('/app/admin/placements')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.625rem 1.25rem', 
              background: 'linear-gradient(135deg, #14b8a6, #0d9488)', 
              border: 'none', 
              borderRadius: 8, 
              color: '#fff', 
              fontSize: '0.875rem', 
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(20, 184, 166, 0.2)'
            }}
          >
            <Plus size={16} /> Create New Drive
          </button>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.fullName}</div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#fca5a5', fontSize: '0.8125rem', cursor: 'pointer' }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <main style={{ padding: '2.5rem', maxWidth: 1200, margin: '0 auto' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
          <p style={{ color: '#475569', fontSize: '0.9375rem' }}>
            Here's your recruitment overview for today.
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {stats.map(s => (
            <div key={s.label} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          {/* Applicant pipeline */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Applicants</h2>
              <span style={{ fontSize: '0.75rem', color: '#2dd4bf', cursor: 'pointer' }}>View all →</span>
            </div>

            {applicants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#334155' }}>
                <Users size={32} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: '0.875rem' }}>No applicants yet.</p>
                <p style={{ fontSize: '0.8125rem', marginTop: '0.375rem' }}>Post a placement drive to start receiving applications.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {applicants.slice(0, 8).map((a: any) => (
                  <div key={a.id} onClick={() => setSelectedApplicant(a)} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                    <div style={{ width: 36, height: 36, background: 'rgba(20,184,166,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', color: '#2dd4bf', flexShrink: 0 }}>
                      {a.student?.fullName?.[0] || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.student?.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>{a.drive?.name}</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.625rem', borderRadius: 100, background: `${statusColor[a.status] || '#818cf8'}18`, color: statusColor[a.status] || '#818cf8', fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                      {a.status}
                    </span>
                    <ChevronRight size={14} style={{ color: '#334155', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active drives */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Your Drives</h2>
            </div>

            {drives.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#334155' }}>
                <Briefcase size={32} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: '0.875rem' }}>No placement drives yet.</p>
                <p style={{ fontSize: '0.8125rem', marginTop: '0.375rem' }}>Contact the UGSkill admin team to set up your first drive.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {drives.map((d: any) => (
                  <div key={d.id} style={{ padding: '1rem', background: 'rgba(20,184,166,0.04)', border: '1px solid rgba(20,184,166,0.12)', borderRadius: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.375rem' }}>{d.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#475569' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Users size={12} /> {d.applicationCount || 0} applicants</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> Closes {d.registrationDeadline ? new Date(d.registrationDeadline).toLocaleDateString() : 'TBD'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Applicant Side-Panel */}
      {selectedApplicant && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedApplicant(null)}>
          <div style={{ width: 400, background: '#0f172a', borderLeft: '1px solid rgba(255,255,255,0.1)', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>{selectedApplicant.student?.fullName}</h2>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Applied for: <span style={{ color: '#f8fafc', fontWeight: 500 }}>{selectedApplicant.drive?.name}</span></div>
              </div>
              <button onClick={() => setSelectedApplicant(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.25rem' }}><XCircle size={24} /></button>
            </div>
            
            {/* Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '0.75rem', padding: '0.375rem 0.875rem', borderRadius: 100, background: `${statusColor[selectedApplicant.status] || '#818cf8'}25`, color: statusColor[selectedApplicant.status] || '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Current Status: {selectedApplicant.status}
              </span>
            </div>

            {/* Resume Action */}
            {selectedApplicant.resumeUrl ? (
              <button onClick={() => window.open(selectedApplicant.resumeUrl, '_blank')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f8fafc', fontWeight: 500, cursor: 'pointer' }}>
                <FileText size={18} /> View Resume
              </button>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 8, color: '#64748b', fontSize: '0.875rem' }}>No resume attached to this application</div>
            )}

            {/* Pipeline Actions */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Update Pipeline Status</h3>
              <button 
                onClick={() => updateStatusMutation.mutate({ id: selectedApplicant.id, status: 'shortlisted' })}
                disabled={updateStatusMutation.isPending || selectedApplicant.status === 'shortlisted'}
                style={{ padding: '1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#4ade80', fontWeight: 600, cursor: 'pointer', opacity: selectedApplicant.status === 'shortlisted' ? 0.5 : 1 }}
              >
                {updateStatusMutation.isPending && selectedApplicant.status !== 'shortlisted' ? 'Updating...' : 'Shortlist Candidate'}
              </button>
              <button 
                onClick={() => updateStatusMutation.mutate({ id: selectedApplicant.id, status: 'interview' })}
                disabled={updateStatusMutation.isPending || selectedApplicant.status === 'interview'}
                style={{ padding: '1rem', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 8, color: '#818cf8', fontWeight: 600, cursor: 'pointer', opacity: selectedApplicant.status === 'interview' ? 0.5 : 1 }}
              >
                Move to Interview Stage
              </button>
              <button 
                onClick={() => updateStatusMutation.mutate({ id: selectedApplicant.id, status: 'rejected' })}
                disabled={updateStatusMutation.isPending || selectedApplicant.status === 'rejected'}
                style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', fontWeight: 600, cursor: 'pointer', opacity: selectedApplicant.status === 'rejected' ? 0.5 : 1 }}
              >
                Reject Candidate
              </button>

              {selectedApplicant.status === 'interview' && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <button
                    onClick={() => selectedActiveSession
                      ? window.open(`/app/placements/interview/${selectedActiveSession.id}`, '_blank')
                      : startInterviewMutation.mutate(selectedApplicant)
                    }
                    disabled={startInterviewMutation.isPending}
                    style={{ 
                      width: '100%', 
                      padding: '1rem', 
                      background: 'linear-gradient(135deg, #eab308, #ca8a04)', 
                      border: 'none', 
                      borderRadius: 8, 
                      color: '#000', 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)'
                    }}
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
                        style={{ marginTop: '0.625rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem', background: copiedLink ? 'rgba(34,197,94,0.12)' : 'rgba(20,184,166,0.1)', border: `1px solid ${copiedLink ? 'rgba(34,197,94,0.35)' : 'rgba(20,184,166,0.25)'}`, borderRadius: 8, color: copiedLink ? '#4ade80' : '#2dd4bf', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}
                      >
                        <Copy size={14} /> {copiedLink ? 'Copied!' : 'Copy Link'}
                      </button>
                      <p style={{ margin: '0.625rem 0 0', color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center' }}>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 16, padding: '2.5rem', maxWidth: 480, width: '90%', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
                  <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#14b8a6,#0d9488)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={16} color="#fff" />
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#f0f9ff' }}>Interview Session Created</h2>
                </div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>Room status: Scheduled</p>
              </div>
              <button onClick={() => setCreatedSession(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.25rem' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Join Link</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#2dd4bf', wordBreak: 'break-all' }}>
                {`${window.location.origin}/app/placements/interview/${createdSession.id}`}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => copyLink(createdSession.id)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', background: copiedLink ? 'rgba(34,197,94,0.15)' : 'rgba(20,184,166,0.12)', border: `1px solid ${copiedLink ? 'rgba(34,197,94,0.4)' : 'rgba(20,184,166,0.3)'}`, borderRadius: 8, color: copiedLink ? '#4ade80' : '#2dd4bf', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
              >
                <Copy size={15} /> {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => window.open(`/app/placements/interview/${createdSession.id}`, '_blank')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', background: 'linear-gradient(135deg,#14b8a6,#0d9488)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
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
    </div>
  );
};
