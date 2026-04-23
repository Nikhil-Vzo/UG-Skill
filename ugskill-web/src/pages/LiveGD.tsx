import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/loaders/Skeleton';
import { Mic, MicOff, Video, VideoOff, MessageSquare, Users, Hand, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { connectSocket, disconnectSocket } from '../lib/socket';
import api from '../lib/api';

interface Participant {
  id: string | number;
  name: string;
  isSpeaking: boolean;
  handRaised: boolean;
}

interface GDSession {
  id: string;
  title: string;
  topic: string;
  participants: Participant[];
  maxParticipants: number;
  aiNotes?: string;
}

const VideoParticipant: React.FC<{ p: Participant, stream?: MediaStream | null, isLocal?: boolean }> = ({ p, stream, isLocal }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{
      backgroundColor: '#111',
      position: 'relative',
      overflow: 'hidden',
      border: p.isSpeaking ? '3px solid var(--primary-glow)' : '3px solid transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      transition: 'border-color 0.2s',
    }}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ width: '80px', height: '80px', background: 'var(--primary-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--primary-glow)', fontWeight: 'bold' }}>
          {typeof p.name === 'string' ? p.name.charAt(0).toUpperCase() : '?'}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', backgroundColor: 'rgba(0,0,0,0.7)', padding: '0.25rem 0.75rem', color: '#fff', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {p.name} {isLocal && '(You)'}
        {p.isSpeaking && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>}
      </div>
      {p.handRaised && (
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'var(--warning)', color: '#000', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Hand size={18} />
        </div>
      )}
    </div>
  );
};

export const LiveGD: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [liveParticipants, setLiveParticipants] = useState<Participant[]>([]);

  // Fetch session details
  const { data: session, isLoading, error } = useQuery<GDSession>({
    queryKey: ['gd-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const res = await api.get(`/placements/gd-sessions/${sessionId}`);
      return res.data.data ?? res.data;
    },
    enabled: !!sessionId,
    refetchInterval: 10_000, // Refresh participant list every 10s (until Socket.io is wired)
    retry: 1,
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.post(`/placements/gd-sessions/${sessionId}/leave`),
    onSuccess: () => navigate('/placements/prep'),
    onError: () => navigate('/placements/prep'), // navigate out regardless
  });

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
      } catch (err) {
        console.error('Failed to get user media', err);
      }
    };
    getMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = micOn);
      localStream.getVideoTracks().forEach(t => t.enabled = videoOn);
    }
  }, [micOn, videoOn, localStream]);

  useEffect(() => {
    if (session?.participants) {
      setLiveParticipants(session.participants);
    }
  }, [session]);

  // Live Socket connection
  useEffect(() => {
    if (!sessionId) return;
    const gdSocket = connectSocket('/gd');
    gdSocket.emit('join:gd', { gdSessionId: sessionId });

    const onJoined = ({ userId, email }: { userId: string, email: string }) => {
      setLiveParticipants(prev => {
        if (prev.find(p => p.id === userId)) return prev;
        return [...prev, { id: userId, name: email, isSpeaking: false, handRaised: false }];
      });
    };

    const onLeft = ({ userId }: { userId: string }) => {
      setLiveParticipants(prev => prev.filter(p => p.id !== userId));
    };

    const onSpeaking = ({ userId }: { userId: string }) => {
      setLiveParticipants(prev => prev.map(p => p.id === userId ? { ...p, isSpeaking: true } : { ...p, isSpeaking: false }));
    };

    gdSocket.on('gd:participant-joined', onJoined);
    gdSocket.on('gd:participant-left', onLeft);
    gdSocket.on('gd:speaking', onSpeaking);

    return () => {
      gdSocket.off('gd:participant-joined', onJoined);
      gdSocket.off('gd:participant-left', onLeft);
      gdSocket.off('gd:speaking', onSpeaking);
      disconnectSocket('/gd');
    };
  }, [sessionId]);

  const participants = liveParticipants;

  // If no sessionId provided, show a "no session" state
  if (!sessionId) {
    return (
      <div style={{ height: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: 'var(--text-low)' }}>
        <AlertCircle size={40} style={{ opacity: 0.4 }} />
        <p>No GD session specified. Go to Interview Prep to join an active session.</p>
        <Button variant="primary" onClick={() => navigate('/placements/prep')}>Back to Prep</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
        <Skeleton variant="rectangular" height={60} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', flex: 1 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rectangular" />)}
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ height: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <AlertCircle size={40} style={{ color: 'var(--error)', opacity: 0.6 }} />
        <p style={{ color: 'var(--text-low)' }}>Failed to load GD session. The session may have ended.</p>
        <Button variant="primary" onClick={() => navigate('/placements/prep')}>Back to Prep</Button>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-base)' }}>
      {/* Header */}
      <header style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-well)', borderBottom: '1px solid var(--surface-highest)' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-high)', fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>{session.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', fontSize: '0.875rem', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--error)', display: 'inline-block' }}></span>
            LIVE
            <span style={{ color: 'var(--text-low)', fontWeight: 'normal', marginLeft: '0.5rem' }}>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--surface-highest)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-high)' }}>
            <Users size={16} /> {participants.length}/{session.maxParticipants ?? '?'}
          </div>
          <Button
            variant="outline"
            style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
            onClick={() => leaveMutation.mutate()}
            disabled={leaveMutation.isPending}
          >
            {leaveMutation.isPending ? 'Leaving...' : 'Leave'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Video Grid */}
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
          {participants.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-lowest)' }}>
              <p>Waiting for participants to join...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: '1rem', height: '100%' }}>
              {participants.map(p => {
                const isLocal = p.name === user?.fullName || (!user?.fullName && p.id === participants[0]?.id);
                return (
                  <VideoParticipant
                    key={p.id}
                    p={p}
                    isLocal={isLocal}
                    stream={isLocal ? localStream : null}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* AI Facilitator Sidebar */}
        <div style={{ width: '300px', backgroundColor: 'var(--surface-well)', borderLeft: '1px solid var(--surface-highest)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--surface-highest)', fontWeight: 600, color: 'var(--text-high)', fontFamily: 'var(--font-display)', fontSize: '0.875rem' }}>
            AI Facilitator Notes
          </div>
          <div style={{ flex: 1, padding: '1rem', color: 'var(--text-low)', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {session.topic && <p><strong style={{ color: 'var(--text-high)' }}>Topic:</strong> {session.topic}</p>}
            {session.aiNotes ? (
              <p>{session.aiNotes}</p>
            ) : (
              <p style={{ color: 'var(--text-lowest)', fontStyle: 'italic' }}>AI notes will appear here as the discussion progresses.</p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <footer style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', backgroundColor: 'var(--surface-well)', borderTop: '1px solid var(--surface-highest)' }}>
        <Button
          variant={micOn ? 'secondary' : 'outline'}
          onClick={() => {
            setMicOn(m => !m);
            // Optionally emit gd:speak if mic is turned on, though usually doing that on audio detection is better.
          }}
          style={{ width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: micOn ? undefined : 'var(--error)', borderColor: micOn ? undefined : 'var(--error)' }}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </Button>
        <Button
          variant={videoOn ? 'secondary' : 'outline'}
          onClick={() => setVideoOn(v => !v)}
          style={{ width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: videoOn ? undefined : 'var(--error)', borderColor: videoOn ? undefined : 'var(--error)' }}
        >
          {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </Button>
        <Button
          variant={handRaised ? 'primary' : 'secondary'}
          onClick={() => setHandRaised(h => !h)}
          style={{ width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Hand size={20} />
        </Button>
        <Button
          variant="secondary"
          style={{ width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <MessageSquare size={20} />
        </Button>
      </footer>
    </div>
  );
};
