import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Users, CalendarCheck, LogOut, TrendingUp, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import api from '../../lib/api';

const statusColor: Record<string, string> = {
  shortlisted: '#22c55e',
  rejected:    '#ef4444',
  pending:     '#f59e0b',
  interview:   '#818cf8',
};

export const HRDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: drives = [] } = useQuery({
    queryKey: ['hr-drives'],
    queryFn: () => api.get('/placements/drives/my').then(r => r.data.data || []),
  });

  const { data: applicants = [] } = useQuery({
    queryKey: ['hr-applicants'],
    queryFn: () => api.get('/placements/applications/my').then(r => r.data.data || []),
  });

  const handleLogout = () => {
    logout('');
    navigate('/hr');
  };

  const stats = [
    { label: 'Active Drives',    value: drives.length,                                     icon: <Briefcase size={20} />,  color: '#2dd4bf' },
    { label: 'Total Applicants', value: applicants.length,                                  icon: <Users size={20} />,      color: '#818cf8' },
    { label: 'Shortlisted',      value: applicants.filter((a: any) => a.status === 'shortlisted').length, icon: <CheckCircle size={20} />, color: '#22c55e' },
    { label: 'Interviews Today', value: 0,                                                  icon: <CalendarCheck size={20} />, color: '#f59e0b' },
  ];

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
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, cursor: 'pointer' }}>
                    <div style={{ width: 36, height: 36, background: 'rgba(20,184,166,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', color: '#2dd4bf', flexShrink: 0 }}>
                      {a.student?.fullName?.[0] || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.student?.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>{a.drive?.title}</div>
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
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.375rem' }}>{d.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#475569' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Users size={12} /> {d.applicationCount || 0} applicants</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> Closes {d.deadline ? new Date(d.deadline).toLocaleDateString() : 'TBD'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
