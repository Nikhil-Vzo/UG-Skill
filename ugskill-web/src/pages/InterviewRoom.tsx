import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Video, Clock, User, ArrowLeft, CheckCircle, AlertTriangle, Loader2, Mic, MicOff, VideoOff, MessageSquare, PhoneMissed } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const InterviewRoom: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['interview-session', sessionId],
    queryFn: () => api.get(`/placements/sessions/${sessionId}`).then(r => r.data.data),
    enabled: !!sessionId,
    refetchInterval: 5000,  // always poll so we catch completed/cancelled status
  });

  const joinMutation = useMutation({
    mutationFn: () =>
      api.patch(`/placements/sessions/${sessionId}/status`, { status: 'in_progress' }),
    onSuccess: () => {
      setJoined(true);
      queryClient.invalidateQueries({ queryKey: ['interview-session', sessionId] });
    },
  });

  const endMutation = useMutation({
    mutationFn: () => api.post(`/placements/sessions/${sessionId}/end`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-session', sessionId] });
      // HR/admins return to their dashboard; students return to placement hub
      navigate(isHR ? '/hr/dashboard' : '/app/placements');
    },
  });

  const isHR = user?.roles?.some(r => ['hr', 'admin', 'super_admin', 'placement_coordinator'].includes(r));
  const isStudent = user?.roles?.includes('student');

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
    if (joined || session?.status === 'in_progress') {
      getMedia();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [joined, session?.status]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = micOn);
      localStream.getVideoTracks().forEach(t => t.enabled = videoOn);
    }
  }, [micOn, videoOn, localStream]);

  // Auto-redirect when session is completed or cancelled externally
  useEffect(() => {
    if (session?.status === 'completed' || session?.status === 'cancelled') {
      navigate(isHR ? '/hr/dashboard' : '/app/placements');
    }
  }, [session?.status, isHR, navigate]);

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
        <button onClick={() => navigate('/app/placements')} style={{...styles.btn, background: 'rgba(255,255,255,0.1)'} as any}>
          <ArrowLeft size={16} /> Back to Placements
        </button>
      </div>
    );
  }

  const isLive = session.status === 'in_progress' || joined;

  if (!isLive) {
    // Waiting room UI
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <button onClick={() => navigate('/app/placements')} style={styles.backBtn}>
              <ArrowLeft size={15} /> Back
            </button>
            <span style={{ ...styles.statusBadge, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
              ● Scheduled
            </span>
          </div>

          <div style={{ textAlign: 'center', padding: '2rem 0 1.5rem' }}>
            <div style={styles.iconRing}>
              <Video size={28} color="#fff" />
            </div>
            <h1 style={{ color: '#f0f9ff', fontSize: '1.5rem', fontWeight: 700, margin: '1rem 0 0.375rem' }}>
              {session.companyName ?? 'Live Interview Session'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              {session.driveName ?? 'Placement Drive'} · Round {session.roundNumber || 1}
            </p>
          </div>

          <div style={{ marginTop: '2rem' }}>
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
          </div>
        </div>
      </div>
    );
  }

  // Live Room UI
  return (
    <div style={styles.liveRoomPage}>
      {/* Header */}
      <header style={styles.roomHeader}>
        <div>
          <h1 style={styles.roomTitle}>
            {session.companyName ?? 'Interview'}
            {session.driveName ? <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '1rem' }}> · {session.driveName}</span> : null}
          </h1>
          <div style={styles.liveIndicator}>
            <span style={styles.liveDot}></span> LIVE · Round {session.roundNumber || 1}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isHR && (
            <button
              style={styles.endInterviewBtn}
              onClick={() => endMutation.mutate()}
              disabled={endMutation.isPending}
            >
              {endMutation.isPending ? 'Ending...' : 'End Interview'}
            </button>
          )}
          <button style={styles.leaveBtn} onClick={() => navigate(isHR ? '/hr/dashboard' : '/app/placements')}>
            Leave Room
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={styles.mainArea}>
        {/* Video Area */}
        <div style={styles.videoGrid}>
          {/* Main remote video (Placeholder if HR, or student if HR) */}
          <div style={styles.remoteVideoContainer}>
            <div style={styles.remotePlaceholder}>
              <User size={64} color="rgba(255,255,255,0.2)" />
              <div style={styles.remoteNameBadge}>
                {isHR ? 'Candidate' : 'Interviewer'}
              </div>
            </div>
          </div>

          {/* Local PIP Video */}
          <div style={styles.localPipContainer}>
            {videoOn && localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={styles.localVideo}
              />
            ) : (
              <div style={{...styles.localVideo, ...styles.localPlaceholder}}>
                <User size={32} color="rgba(255,255,255,0.4)" />
              </div>
            )}
            <div style={styles.localNameBadge}>You</div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>AI Feedback & Chat</div>
          <div style={styles.sidebarContent}>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>AI assistant is monitoring the interview...</p>
            {/* Example AI notes */}
            <div style={styles.aiNote}>
              <div style={styles.aiNoteTitle}>Suggestion</div>
              <div>Ask about their experience with React.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <footer style={styles.controlsFooter}>
        <div style={styles.controlGroup}>
          <button style={micOn ? styles.controlBtn : styles.controlBtnOff} onClick={() => setMicOn(!micOn)}>
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button style={videoOn ? styles.controlBtn : styles.controlBtnOff} onClick={() => setVideoOn(!videoOn)}>
            {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
          <button style={styles.controlBtn} title="Chat">
            <MessageSquare size={20} />
          </button>
          <button style={styles.endCallBtn} onClick={() => navigate('/app/placements')}>
            <PhoneMissed size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#060b14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  center: { minHeight: '100vh', background: '#060b14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#f0f9ff', textAlign: 'center', padding: '2rem' },
  card: { background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: '2rem', maxWidth: 520, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem' },
  statusBadge: { fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: 20, textTransform: 'capitalize' },
  iconRing: { width: 72, height: 72, background: 'linear-gradient(135deg,#14b8a6,#0d9488)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 0 30px rgba(20,184,166,0.3)' },
  joinBtn: { width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#14b8a6,#0d9488)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', boxShadow: '0 8px 24px rgba(20,184,166,0.35)' },
  waitBox: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, color: '#fbbf24', fontSize: '0.875rem' },
  
  // Live Room Styles
  liveRoomPage: { height: '100vh', background: '#020617', display: 'flex', flexDirection: 'column', color: '#f8fafc', overflow: 'hidden' },
  roomHeader: { padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  roomTitle: { margin: 0, fontSize: '1.25rem', fontWeight: 600 },
  liveIndicator: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' },
  liveDot: { width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 2s infinite' },
  leaveBtn: { padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s' },
  endInterviewBtn: { padding: '0.5rem 1rem', background: '#ef4444', border: '1px solid #ef4444', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700, transition: 'all 0.2s' },
  mainArea: { flex: 1, display: 'flex', overflow: 'hidden', padding: '1rem', gap: '1rem' },
  videoGrid: { flex: 1, position: 'relative', display: 'flex', background: '#0f172a', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' },
  remoteVideoContainer: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090e17' },
  remotePlaceholder: { width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  remoteNameBadge: { position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '0.25rem 0.75rem', borderRadius: 6, fontSize: '0.875rem', color: '#fff' },
  localPipContainer: { position: 'absolute', bottom: '1.5rem', right: '1.5rem', width: 240, height: 135, borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', background: '#1e293b' },
  localVideo: { width: '100%', height: '100%', objectFit: 'cover' },
  localPlaceholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#334155' },
  localNameBadge: { position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', color: '#fff' },
  sidebar: { width: 320, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sidebarHeader: { padding: '1rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' },
  sidebarContent: { flex: 1, padding: '1rem', overflowY: 'auto' },
  aiNote: { background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)', padding: '0.75rem', borderRadius: 8, marginTop: '1rem', fontSize: '0.875rem' },
  aiNoteTitle: { color: '#2dd4bf', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  controlsFooter: { padding: '1rem', display: 'flex', justifyContent: 'center', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.05)' },
  controlGroup: { display: 'flex', gap: '1rem', alignItems: 'center' },
  controlBtn: { width: 48, height: 48, borderRadius: 24, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  controlBtnOff: { width: 48, height: 48, borderRadius: 24, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  endCallBtn: { width: 56, height: 48, borderRadius: 24, background: '#ef4444', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', padding: '0 1rem' }
};

export default InterviewRoom;
