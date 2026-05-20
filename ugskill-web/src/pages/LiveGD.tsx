import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Mic, MicOff, Video, VideoOff, MessageSquare, Users, Hand, AlertCircle, PhoneMissed, Loader2 } from 'lucide-react';
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
      backgroundColor: '#0f172a',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '16px',
      border: p.isSpeaking ? '2px solid #14b8a6' : '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      height: '100%',
      transition: 'all 0.3s ease',
      boxShadow: p.isSpeaking ? '0 0 20px rgba(20,184,166,0.3)' : 'none',
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
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#14b8a6', fontWeight: 'bold' }}>
          {typeof p.name === 'string' ? p.name.charAt(0).toUpperCase() : '?'}
        </div>
      )}
      
      <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)', padding: '0.4rem 0.8rem', borderRadius: '8px', color: '#fff', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        {p.name} {isLocal && '(You)'}
        {p.isSpeaking && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }}></span>}
      </div>
      
      {p.handRaised && (
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(245,158,11,0.9)', backdropFilter: 'blur(4px)', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.4)' }}>
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
    refetchInterval: 10_000, 
    retry: 1,
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.post(`/placements/gd-sessions/${sessionId}/leave`),
    onSuccess: () => navigate('/app/placements/prep'),
    onError: () => navigate('/app/placements/prep'), 
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

  if (!sessionId) {
    return (
      <div style={styles.centerPage}>
        <AlertCircle size={48} color="#64748b" style={{ opacity: 0.5, marginBottom: '1rem' }} />
        <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>No GD session specified.</p>
        <button style={styles.primaryBtn} onClick={() => navigate('/app/placements/prep')}>Back to Prep</button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={styles.centerPage}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#14b8a6', marginBottom: '1rem' }} />
        <p style={{ color: '#94a3b8' }}>Connecting to Group Discussion...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={styles.centerPage}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <p style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Failed to load GD session</p>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>The session may have ended or the link is invalid.</p>
        <button style={styles.primaryBtn} onClick={() => navigate('/app/placements/prep')}>Back to Prep</button>
      </div>
    );
  }

  // Determine grid layout based on participant count (up to 4 for a nice 2x2 grid)
  const gridStyle = participants.length > 2 
    ? { gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(2, 1fr)' } 
    : participants.length === 2 
      ? { gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: '1fr' }
      : { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };

  return (
    <div style={styles.liveRoomPage}>
      {/* Header */}
      <header style={styles.roomHeader}>
        <div>
          <h1 style={styles.roomTitle}>{session.title}</h1>
          <div style={styles.liveIndicator}>
            <span style={styles.liveDot}></span> LIVE
            <span style={{ color: '#94a3b8', fontWeight: 'normal', marginLeft: '0.5rem' }}>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={styles.participantCount}>
            <Users size={16} color="#14b8a6" /> 
            <span>{participants.length}/{session.maxParticipants ?? 4}</span>
          </div>
          <button
            style={styles.leaveBtn}
            onClick={() => leaveMutation.mutate()}
            disabled={leaveMutation.isPending}
          >
            {leaveMutation.isPending ? 'Leaving...' : 'Leave GD'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={styles.mainArea}>
        {/* Video Grid */}
        <div style={styles.videoArea}>
          {participants.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
              Waiting for participants to join...
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem', height: '100%', width: '100%', ...gridStyle }}>
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

        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>GD Context & AI Facilitator</div>
          <div style={styles.sidebarContent}>
            {session.topic && (
              <div style={styles.topicBox}>
                <div style={styles.topicLabel}>Current Topic</div>
                <div style={styles.topicText}>{session.topic}</div>
              </div>
            )}
            
            <div style={styles.aiNote}>
              <div style={styles.aiNoteTitle}>AI Facilitator</div>
              {session.aiNotes ? (
                <p style={{ margin: 0 }}>{session.aiNotes}</p>
              ) : (
                <p style={{ margin: 0, color: '#94a3b8', fontStyle: 'italic' }}>Monitoring discussion balance and providing real-time prompts here...</p>
              )}
            </div>
            
            {/* Example of another note to make sidebar look full */}
            <div style={{ ...styles.aiNote, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ ...styles.aiNoteTitle, color: '#60a5fa' }}>Guidance</div>
              <p style={{ margin: 0 }}>Make sure to let others speak. Aim for concise, impactful points.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <footer style={styles.controlsFooter}>
        <div style={styles.controlGroup}>
          <button 
            style={micOn ? styles.controlBtn : styles.controlBtnOff} 
            onClick={() => setMicOn(!micOn)}
            title={micOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button 
            style={videoOn ? styles.controlBtn : styles.controlBtnOff} 
            onClick={() => setVideoOn(!videoOn)}
            title={videoOn ? "Turn Off Camera" : "Turn On Camera"}
          >
            {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
          <button 
            style={handRaised ? styles.controlBtnActive : styles.controlBtn} 
            onClick={() => setHandRaised(!handRaised)}
            title={handRaised ? "Lower Hand" : "Raise Hand"}
          >
            <Hand size={20} />
          </button>
          <button style={styles.controlBtn} title="Chat">
            <MessageSquare size={20} />
          </button>
          <button style={styles.endCallBtn} onClick={() => leaveMutation.mutate()}>
            <PhoneMissed size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  centerPage: { height: '100vh', background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' },
  primaryBtn: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #14b8a6, #0d9488)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', marginTop: '1rem', boxShadow: '0 4px 12px rgba(20,184,166,0.3)' },
  
  // Live Room Styles
  liveRoomPage: { height: '100vh', background: '#020617', display: 'flex', flexDirection: 'column', color: '#f8fafc', overflow: 'hidden' },
  roomHeader: { padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  roomTitle: { margin: 0, fontSize: '1.25rem', fontWeight: 600 },
  liveIndicator: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' },
  liveDot: { width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 2s infinite' },
  participantCount: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500 },
  leaveBtn: { padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s' },
  
  mainArea: { flex: 1, display: 'flex', overflow: 'hidden', padding: '1rem', gap: '1rem' },
  videoArea: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  
  sidebar: { width: 320, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sidebarHeader: { padding: '1rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' },
  sidebarContent: { flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' },
  
  topicBox: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' },
  topicLabel: { fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 600 },
  topicText: { fontSize: '1rem', color: '#f8fafc', lineHeight: 1.5 },
  
  aiNote: { background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)', padding: '1rem', borderRadius: 8, fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.5 },
  aiNoteTitle: { color: '#2dd4bf', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  
  controlsFooter: { padding: '1rem', display: 'flex', justifyContent: 'center', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.05)' },
  controlGroup: { display: 'flex', gap: '1rem', alignItems: 'center' },
  controlBtn: { width: 52, height: 52, borderRadius: 26, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  controlBtnActive: { width: 52, height: 52, borderRadius: 26, background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.5)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 15px rgba(245,158,11,0.3)' },
  controlBtnOff: { width: 52, height: 52, borderRadius: 26, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  endCallBtn: { width: 64, height: 52, borderRadius: 26, background: '#ef4444', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', padding: '0 1rem', boxShadow: '0 4px 15px rgba(239,68,68,0.4)' }
};

export default LiveGD;
