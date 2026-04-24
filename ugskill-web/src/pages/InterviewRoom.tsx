import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Video, Clock, User, ArrowLeft, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

/**
 * InterviewRoom – Student-facing page to join a scheduled interview session.
 * Accessed via /app/placements/interview/:sessionId
 * HR shares this link with the candidate after creating the session.
 */
const InterviewRoom: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [joined, setJoined] = useState(false);

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['interview-session', sessionId],
    queryFn: () => api.get(`/placements/sessions/${sessionId}`).then(r => r.data.data),
    enabled: !!sessionId,
    refetchInterval: joined ? false : 5000, // poll until joined
  });

  const joinMutation = useMutation({
    mutationFn: () =>
      api.patch(`/placements/sessions/${sessionId}/status`, { status: 'in_progress' }),
    onSuccess: () => {
      setJoined(true);
      queryClient.invalidateQueries({ queryKey: ['interview-session', sessionId] });
    },
  });

  const isHR = user?.roles?.includes('hr') || user?.roles?.includes('admin');
  const isStudent = user?.roles?.includes('student');

  if (isLoading) {
    return (
      <div style={styles.center}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#14b8a6' }} />
        <p style={{ color: '#64748b', marginTop: '1rem' }}>Loading session…</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={styles.center}>
        <AlertTriangle size={40} color="#ef4444" />
        <h2 style={{ color: '#f0f9ff', marginTop: '1rem' }}>Session not found</h2>
        <p style={{ color: '#64748b' }}>This interview session may have expired or the link is invalid.</p>
        <button onClick={() => navigate('/app/placements')} style={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Placements
        </button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    scheduled: '#f59e0b',
    in_progress: '#14b8a6',
    completed: '#22c55e',
    cancelled: '#ef4444',
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate('/app/placements')} style={styles.backBtn}>
            <ArrowLeft size={15} /> Back
          </button>
          <span style={{ ...styles.statusBadge, background: `${statusColors[session.status] || '#64748b'}22`, color: statusColors[session.status] || '#64748b', border: `1px solid ${statusColors[session.status] || '#64748b'}44` }}>
            ● {session.status?.replace('_', ' ')}
          </span>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', padding: '2rem 0 1.5rem' }}>
          <div style={styles.iconRing}>
            <Video size={28} color="#fff" />
          </div>
          <h1 style={{ color: '#f0f9ff', fontSize: '1.5rem', fontWeight: 700, margin: '1rem 0 0.375rem' }}>
            Live Interview Session
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Round {session.roundNumber || 1} · {session.sessionType}
          </p>
        </div>

        {/* Info Grid */}
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <User size={16} color="#14b8a6" />
            <div>
              <div style={styles.infoLabel}>Candidate</div>
              <div style={styles.infoVal}>{session.studentId?.slice(0, 8)}…</div>
            </div>
          </div>
          <div style={styles.infoCard}>
            <Clock size={16} color="#14b8a6" />
            <div>
              <div style={styles.infoLabel}>Scheduled</div>
              <div style={styles.infoVal}>{session.createdAt ? new Date(session.createdAt).toLocaleString() : 'Now'}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: '2rem' }}>
          {session.status === 'scheduled' && !joined && (
            <>
              {isStudent && (
                <button
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  style={styles.joinBtn}
                >
                  {joinMutation.isPending ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Video size={18} />}
                  {joinMutation.isPending ? 'Joining…' : 'Join Interview Now'}
                </button>
              )}
              {isHR && (
                <div style={styles.waitBox}>
                  <Clock size={20} color="#f59e0b" />
                  <span>Waiting for the candidate to join this session…</span>
                </div>
              )}
            </>
          )}

          {(session.status === 'in_progress' || joined) && (
            <div style={styles.liveBox}>
              <CheckCircle size={20} color="#14b8a6" />
              <span>
                {joined && isStudent
                  ? 'You have joined the session! Your interviewer will be with you shortly.'
                  : 'Session is live — the candidate has joined.'}
              </span>
            </div>
          )}

          {session.status === 'completed' && (
            <div style={styles.completedBox}>
              <CheckCircle size={20} color="#22c55e" />
              <span>This interview session has been completed.</span>
            </div>
          )}

          {session.status === 'cancelled' && (
            <div style={styles.cancelBox}>
              <AlertTriangle size={20} color="#ef4444" />
              <span>This session was cancelled.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#060b14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  center: { minHeight: '100vh', background: '#060b14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#f0f9ff', textAlign: 'center', padding: '2rem' },
  card: { background: '#0f172a', border: '1px solid rgba(20,184,166,0.15)', borderRadius: 20, padding: '2rem', maxWidth: 520, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem' },
  statusBadge: { fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: 20, textTransform: 'capitalize' },
  iconRing: { width: 72, height: 72, background: 'linear-gradient(135deg,#14b8a6,#0d9488)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 0 30px rgba(20,184,166,0.3)' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' },
  infoCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.625rem' },
  infoLabel: { fontSize: '0.6875rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' },
  infoVal: { fontSize: '0.875rem', color: '#cbd5e1', fontWeight: 500 },
  joinBtn: { width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#14b8a6,#0d9488)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', boxShadow: '0 8px 24px rgba(20,184,166,0.35)' },
  waitBox: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, color: '#fbbf24', fontSize: '0.875rem' },
  liveBox: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.25)', borderRadius: 10, color: '#2dd4bf', fontSize: '0.875rem' },
  completedBox: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, color: '#4ade80', fontSize: '0.875rem' },
  cancelBox: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontSize: '0.875rem' },
};

export default InterviewRoom;
