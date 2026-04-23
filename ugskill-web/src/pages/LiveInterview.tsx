import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Skeleton } from '../components/loaders/Skeleton';
import { Button } from '../components/ui/Button';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  FileText, Clock, AlertCircle
} from 'lucide-react';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

interface InterviewSession {
  id: string;
  interviewerName: string;
  candidateName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'in-progress' | 'completed' | 'scheduled';
  notes?: string;
}

export const LiveInterview: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [liveNotes, setLiveNotes] = useState<string | null>(null);

  const { data: session, isLoading, error } = useQuery<InterviewSession>({
    queryKey: ['interview-session', sessionId],
    queryFn: async () => {
      const res = await api.get(`/placements/sessions/${sessionId}`);
      return res.data.data ?? res.data;
    },
    enabled: !!sessionId,
    retry: 1,
  });

  const endMutation = useMutation({
    mutationFn: () => api.post(`/placements/sessions/${sessionId}/end`),
    onSuccess: () => {
      setSessionEnded(true);
      setTimeout(() => navigate('/placements/prep'), 3000);
    },
  });

  // Session timer
  useEffect(() => {
    if (sessionEnded) return;
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [sessionEnded]);

  // Live Socket connection
  useEffect(() => {
    if (!sessionId || sessionEnded) return;

    const intSocket = connectSocket('/interview');
    intSocket.emit('join:session', { sessionId });

    const onNotesSynced = ({ notes }: { notes: string }) => {
      setLiveNotes(notes);
    };

    const onSessionEnded = () => {
      setSessionEnded(true);
      setTimeout(() => navigate('/placements/prep'), 3000);
    };

    intSocket.on('notes:synced', onNotesSynced);
    intSocket.on('session:ended', onSessionEnded);

    return () => {
      intSocket.off('notes:synced', onNotesSynced);
      intSocket.off('session:ended', onSessionEnded);
      disconnectSocket('/interview');
    };
  }, [sessionId, sessionEnded, navigate]);

  const displayNotes = liveNotes ?? session?.notes;

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!sessionId) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', background: '#0a0a0a', color: '#ccc' }}>
        <AlertCircle size={40} style={{ opacity: 0.4 }} />
        <p>No session ID specified.</p>
        <Button variant="outline" onClick={() => navigate('/placements/prep')}>Back to Prep</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
        <Skeleton variant="rectangular" height={60} style={{ background: '#1a1a1a' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1 }}>
          <Skeleton variant="rectangular" style={{ background: '#1a1a1a' }} />
          <Skeleton variant="rectangular" style={{ background: '#1a1a1a' }} />
        </div>
      </div>
    );
  }

  if (sessionEnded) {
    return (
      <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: '#ccc' }}>
        <div style={{ fontSize: '3rem' }}>✓</div>
        <h2 style={{ color: '#fff', margin: 0 }}>Session Ended</h2>
        <p>Redirecting you back to Interview Prep...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: '#ccc' }}>
        <AlertCircle size={40} style={{ color: '#ef4444', opacity: 0.6 }} />
        <p>Failed to load interview session.</p>
        <Button variant="outline" onClick={() => navigate('/placements/prep')}>Back to Prep</Button>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', color: '#fff', fontFamily: 'var(--font-primary)' }}>
      {/* Header bar */}
      <header style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', borderBottom: '1px solid #222' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }}></div>
          <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em' }}>LIVE INTERVIEW</span>
          <span style={{ color: '#666', fontSize: '0.875rem' }}>— {session.interviewerName} with {session.candidateName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#888', fontSize: '0.875rem' }}>
            <Clock size={15} />
            <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#ccc' }}>{formatTime(elapsedSeconds)}</span>
          </div>
          <Button
            variant="outline"
            style={{ color: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            onClick={() => endMutation.mutate()}
            disabled={endMutation.isPending}
          >
            <PhoneOff size={16} />
            {endMutation.isPending ? 'Ending...' : 'End Session'}
          </Button>
        </div>
      </header>

      {/* Main grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', overflow: 'hidden' }}>
        {/* Video area */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '0.5rem', padding: '0.75rem' }}>
          {/* Interviewer tile */}
          <div style={{ background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '2px solid #222' }}>
            <div style={{ width: 80, height: 80, background: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#60a5fa', fontWeight: 'bold' }}>
              {session.interviewerName?.charAt(0) ?? 'I'}
            </div>
            <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', background: 'rgba(0,0,0,0.7)', padding: '0.25rem 0.75rem', fontSize: '0.8125rem', color: '#fff' }}>
              {session.interviewerName} (Interviewer)
            </div>
          </div>

          {/* Candidate tile (you) */}
          <div style={{ background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '2px solid var(--primary-glow)' }}>
            {videoOn ? (
              <div style={{ width: 80, height: 80, background: 'var(--primary-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--primary-glow)', fontWeight: 'bold' }}>
                {session.candidateName?.charAt(0) ?? 'C'}
              </div>
            ) : (
              <div style={{ color: '#555', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <VideoOff size={32} />
                <span style={{ fontSize: '0.8125rem' }}>Camera Off</span>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', background: 'rgba(0,0,0,0.7)', padding: '0.25rem 0.75rem', fontSize: '0.8125rem', color: '#fff' }}>
              {session.candidateName} (You)
            </div>
            {!micOn && (
              <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', color: '#ef4444' }}>
                <MicOff size={18} />
              </div>
            )}
          </div>
        </div>

        {/* Notes panel */}
        <div style={{ background: '#111', borderLeft: '1px solid #222', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#aaa', fontSize: '0.875rem', fontWeight: 600 }}>
            <FileText size={16} /> Interviewer Notes
          </div>
          <div style={{ flex: 1, padding: '1rem', color: '#888', fontSize: '0.875rem', lineHeight: 1.65 }}>
            {displayNotes ? (
              <p style={{ margin: 0 }}>{displayNotes}</p>
            ) : (
              <p style={{ margin: 0, fontStyle: 'italic' }}>Notes typed by the interviewer will appear here in real time (Socket.io feed).</p>
            )}
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <footer style={{ padding: '0.875rem', display: 'flex', justifyContent: 'center', gap: '1rem', background: '#111', borderTop: '1px solid #222' }}>
        <button
          onClick={() => setMicOn(m => !m)}
          style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${micOn ? '#333' : '#ef4444'}`, background: micOn ? '#1a1a1a' : 'rgba(239,68,68,0.15)', color: micOn ? '#ccc' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button
          onClick={() => setVideoOn(v => !v)}
          style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${videoOn ? '#333' : '#ef4444'}`, background: videoOn ? '#1a1a1a' : 'rgba(239,68,68,0.15)', color: videoOn ? '#ccc' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button
          onClick={() => endMutation.mutate()}
          disabled={endMutation.isPending}
          style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #ef4444', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <PhoneOff size={20} />
        </button>
      </footer>
    </div>
  );
};
