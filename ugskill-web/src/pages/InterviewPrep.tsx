import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/loaders/Skeleton';
import { Calendar, Video, Clock, AlertCircle, MessageSquare, Sparkles } from 'lucide-react';
import api from '../lib/api';
import './InterviewPrep.css';

interface Session {
  id: string;
  sessionType: 'live_interview' | 'mock_interview' | 'group_discussion';
  createdAt: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  companyName?: string;
  driveName?: string;
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
    <div className="interview-prep-page">
      <header className="interview-prep-hero ugs-hero">
        <div className="interview-prep-hero-content">
          <div className="ugs-hero-badge"><Sparkles size={14} /> Interview Lab</div>
          <h1 className="ugs-hero-title">Interview Prep</h1>
          <p className="ugs-hero-subtitle">Schedule mock interviews, join group discussions, and track upcoming sessions.</p>
        </div>
      </header>

      <div className="interview-prep-actions">
        <div className="interview-prep-action-card interview-prep-action-card--mock">
          <div className="interview-prep-action-icon">
            <Calendar size={22} />
          </div>
          <h3 className="interview-prep-action-title">Mock Interviews</h3>
          <p className="interview-prep-action-desc">Practice 1-on-1 with industry experts across different tech stacks.</p>
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
            <p className="interview-prep-action-error">
              <AlertCircle size={14} /> Failed to schedule. Please try again.
            </p>
          )}
        </div>

        <div className="interview-prep-action-card interview-prep-action-card--gd">
          <div className="interview-prep-action-icon">
            <MessageSquare size={22} />
          </div>
          <h3 className="interview-prep-action-title">Group Discussions</h3>
          <p className="interview-prep-action-desc">Join live peer rooms to refine communication and teamwork skills.</p>
          <Button
            variant="secondary"
            leftIcon={<Video size={18} />}
            fullWidth
            onClick={handleJoinGd}
            disabled={loadingGdSessions}
          >
            {loadingGdSessions ? 'Checking Sessions...' : 'Join Live GD'}
          </Button>
        </div>
      </div>

      {showMockModal && (
        <div className="interview-prep-modal-backdrop">
          <div className="interview-prep-modal">
            <h2>Schedule a Mock Interview</h2>
            <p>A mock interview will be created and matched with an available interviewer. You&apos;ll receive a notification once matched.</p>
            <div className="interview-prep-modal-actions">
              <Button variant="ghost" onClick={() => setShowMockModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => scheduleMockMutation.mutate()} disabled={scheduleMockMutation.isPending}>
                {scheduleMockMutation.isPending ? 'Scheduling...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <section className="interview-prep-sessions">
        <h2 className="interview-prep-sessions-title"><Calendar size={18} /> Upcoming Sessions</h2>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2].map(i => <Skeleton key={i} variant="rectangular" height={72} />)}
          </div>
        ) : error ? (
          <div className="interview-prep-error-banner">
            <AlertCircle size={18} /> Failed to load sessions. Please refresh.
          </div>
        ) : sessions.length > 0 ? (
          <ul className="interview-prep-session-list">
            {sessions.map((session) => (
              <li key={session.id} className="interview-prep-session-item">
                <div className="interview-prep-session-body">
                  <div className="interview-prep-session-icon">
                    {session.sessionType === 'mock_interview' || session.sessionType === 'live_interview' ? <Calendar size={24} /> : <Video size={24} />}
                  </div>
                  <div className="interview-prep-session-info">
                    <h4>
                      {session.sessionType === 'mock_interview'
                        ? 'Mock Interview'
                        : session.sessionType === 'live_interview'
                        ? `${session.companyName || 'Live'} Interview`
                        : 'Group Discussion'}
                    </h4>
                    <p><Clock size={14} /> {formatTime(session.createdAt)}</p>
                  </div>
                </div>
                <div className="interview-prep-session-actions">
                  <Badge
                    variant={session.status === 'scheduled' ? 'outline' : session.status === 'completed' ? 'success' : 'warning'}
                  >
                    {session.status}
                  </Badge>
                  {session.id && (session.status === 'scheduled' || session.status === 'in_progress') && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/app/live-interview/${session.id}`)}
                    >
                      Join
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="interview-prep-empty">
            <Calendar size={36} />
            <p>No upcoming sessions scheduled.</p>
            <p className="interview-prep-empty-hint">Use the cards above to schedule a mock interview or join a live GD.</p>
          </div>
        )}
      </section>
    </div>
  );
};
