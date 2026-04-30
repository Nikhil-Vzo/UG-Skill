import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/loaders/Skeleton';
import { Calendar, Video, Clock, AlertCircle } from 'lucide-react';
import '../components/ui/Primitives.css';
import api from '../lib/api';

interface Session {
  id: string;
  type: string;
  scheduledAt: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  sessionId?: string;
}

interface GDSession {
  id: string;
  topic: string;
  status: string;
}

export const InterviewPrep: React.FC = () => {
  const navigate = useNavigate();
  const [showMockModal, setShowMockModal] = useState(false);

  const { data: sessions = [], isLoading, error } = useQuery<Session[]>({
    queryKey: ['placement-sessions-upcoming'],
    queryFn: async () => {
      const res = await api.get('/placements/sessions?type=upcoming&studentId=me');
      return res.data.data ?? res.data ?? [];
    },
    retry: 1,
  });

  const { data: gdSessions = [], isLoading: loadingGdSessions } = useQuery<GDSession[]>({
    queryKey: ['gd-sessions-open'],
    queryFn: async () => {
      const res = await api.get('/placements/gd-sessions?status=scheduled&limit=5');
      const payload = res.data.data ?? res.data;
      return payload.data ?? payload.sessions ?? payload ?? [];
    },
    retry: 1,
  });

  const scheduleMockMutation = useMutation({
    mutationFn: () => api.post('/placements/sessions/mock'),
    onSuccess: (res) => {
      setShowMockModal(false);
      // If the API returns a session ID, navigate to the live interview room
      const sessionId = res.data?.data?.session?.id ?? res.data?.data?.id ?? res.data?.id;
      if (sessionId) navigate(`/app/live-interview/${sessionId}`);
    },
  });

  const handleJoinGd = () => {
    const nextSession = gdSessions[0];
    if (nextSession?.id) {
      navigate(`/app/live-gd/${nextSession.id}`);
      return;
    }
    navigate('/app/live-gd');
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (d.toDateString() === today.toDateString()) return `Today, ${timeStr}`;
      if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${timeStr}`;
      return `${d.toLocaleDateString()}, ${timeStr}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col" style={{ padding: '2rem', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header className="flex" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h1 className="text-3xl font-bold" style={{ margin: 0, color: 'var(--text-high)' }}>Interview Prep Dashboard</h1>
        <p style={{ margin: 0, color: 'var(--text-low)' }}>Schedule mock interviews, participate in group discussions, and track your performance.</p>
      </header>

      {/* Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <Card title="Mock Interviews">
          <p style={{ color: 'var(--text-low)', marginBottom: '1.5rem' }}>Practice 1-on-1 with industry experts across different tech stacks.</p>
          <Button
            variant="primary"
            leftIcon={<Calendar size={18} />}
            fullWidth
            onClick={() => setShowMockModal(true)}
            disabled={scheduleMockMutation.isPending}
          >
            {scheduleMockMutation.isPending ? 'Scheduling...' : 'Schedule Mock'}
          </Button>
          {scheduleMockMutation.isError && (
            <p style={{ color: 'var(--error)', fontSize: '0.8125rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <AlertCircle size={14} /> Failed to schedule. Please try again.
            </p>
          )}
        </Card>

        <Card title="Group Discussions">
          <p style={{ color: 'var(--text-low)', marginBottom: '1.5rem' }}>Join live peer-to-peer discussion rooms to refine communication skills.</p>
          <Button
            variant="secondary"
            leftIcon={<Video size={18} />}
            fullWidth
            onClick={handleJoinGd}
            disabled={loadingGdSessions}
          >
            {loadingGdSessions ? 'Checking Sessions...' : 'Join Live GD'}
          </Button>
        </Card>
      </div>

      {/* Mock scheduling modal */}
      {showMockModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: 420, width: '90%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ margin: 0, color: 'var(--text-high)', fontFamily: 'var(--font-display)' }}>Schedule a Mock Interview</h2>
            <p style={{ color: 'var(--text-low)', fontSize: '0.875rem' }}>A mock interview will be created and matched with an available interviewer. You'll receive a notification once matched.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowMockModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => scheduleMockMutation.mutate()} disabled={scheduleMockMutation.isPending}>
                {scheduleMockMutation.isPending ? 'Scheduling...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      <Card title="Upcoming Sessions" style={{ flexGrow: 1 }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2].map(i => <Skeleton key={i} variant="rectangular" height={72} />)}
          </div>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--error)', fontSize: '0.875rem' }}>
            <AlertCircle size={18} /> Failed to load sessions. Please refresh.
          </div>
        ) : sessions.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sessions.map((session) => (
              <li key={session.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--surface-highest)', borderRadius: '0px', background: 'var(--surface-well)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: 'var(--primary-low)', borderRadius: '0px', color: 'var(--primary-glow)' }}>
                    {session.type.toLowerCase().includes('mock') || session.type.toLowerCase().includes('interview') ? <Calendar size={24} /> : <Video size={24} />}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-high)' }}>{session.type}</h4>
                    <p style={{ margin: 0, color: 'var(--text-low)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={14} /> {formatTime(session.scheduledAt)}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Badge
                    variant={session.status === 'scheduled' ? 'outline' : session.status === 'completed' ? 'success' : 'warning'}
                  >
                    {session.status}
                  </Badge>
                  {session.sessionId && session.status === 'scheduled' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/app/live-interview/${session.sessionId}`)}
                    >
                      Join
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-lowest)' }}>
            <Calendar size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No upcoming sessions scheduled.</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>Use the buttons above to schedule a mock interview or join a live GD.</p>
          </div>
        )}
      </Card>
    </div>
  );
};
