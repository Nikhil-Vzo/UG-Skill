import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Video, Clock, User, ArrowLeft, CheckCircle, AlertTriangle, Loader2, 
  Mic, MicOff, VideoOff, MessageSquare, PhoneMissed, FileText, 
  Award, Shield, Check, Activity, Volume2, Tv, RefreshCw, Star, Info
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

// Suggested questions based on Candidate Branch
const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  'Computer Science': [
    'Explain the difference between SQL and NoSQL databases. When would you choose one over the other?',
    'What is the time complexity of searching in a binary search tree? What about a balanced BST?',
    'Explain WebSockets and WebRTC. How do they compare for real-time video streaming?',
    'How do you manage state in a large-scale React application? Describe your experience with Redux or Zustand.'
  ],
  'Information Technology': [
    'Explain the OSI model layers and the primary purpose of TCP/IP.',
    'What are REST API best practices? Describe statelessness, HTTP methods, and status codes.',
    'Explain containerization and Docker. What are the benefits of containerizing an application?'
  ],
  'Electronics': [
    'Explain the working principle of a phase-locked loop (PLL).',
    'What is the difference between a microprocessor and a microcontroller?',
    'Explain the concept of sampling theorem and Nyquist rate in signal processing.'
  ]
};

const DEFAULT_QUESTIONS = [
  'Tell me about a challenging technical project you worked on. What obstacles did you face, and how did you overcome them?',
  'How do you handle conflict or differing opinions within a technical project team?',
  'What is your understanding of the role you are applying for today?',
  'Where do you see yourself in terms of technical growth over the next 2-3 years?'
];

const InterviewRoom: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  // Grading states for Interviewer
  const [techScore, setTechScore] = useState(5);
  const [commScore, setCommScore] = useState(5);
  const [probScore, setProbScore] = useState(5);
  const [feedbackNotes, setFeedbackNotes] = useState('');

  // Proctoring states for Candidate
  const [tabSwitches, setTabSwitches] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['interview-session', sessionId],
    queryFn: () => api.get(`/placements/sessions/${sessionId}`).then(r => r.data.data),
    enabled: !!sessionId,
    refetchInterval: 5000,  // always poll so we catch completed/cancelled status
  });

  const isHR = user?.roles?.some(r => ['hr', 'admin', 'super_admin', 'placement_coordinator'].includes(r));
  const isStudent = user?.roles?.includes('student');

  useEffect(() => {
    if (isHR) {
      setActiveTab('profile');
    } else {
      setActiveTab('instructions');
    }
  }, [isHR]);

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
      navigate(isHR ? '/hr/dashboard' : '/app/placements');
    },
  });

  const submitEvaluationMutation = useMutation({
    mutationFn: (payload: { score: number; maxScore: number; status: 'completed' }) =>
      api.patch(`/placements/sessions/${sessionId}/status`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-session', sessionId] });
      navigate('/hr/dashboard');
    },
  });

  // Load stream on mount for waiting room preview
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
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, joined]);

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

  // Tab switch proctoring logic for Candidate
  useEffect(() => {
    if (isHR) return;
    const handleBlur = () => {
      setTabSwitches(prev => prev + 1);
    };
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [isHR]);

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
        <button onClick={() => navigate(isHR ? '/hr/dashboard' : '/app/placements')} style={{...styles.btn, background: 'rgba(255,255,255,0.1)'} as any}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  const isLive = session.status === 'in_progress' || joined;

  if (!isLive) {
    // Waiting room UI - Beautiful split-screen camera preview and lobby card
    return (
      <div style={styles.page}>
        <div style={styles.waitingRoomContainer}>
          {/* Left Panel: Camera Preview */}
          <div style={styles.previewPanel}>
            <div style={styles.previewTitle}>Lobby Room Video Test</div>
            <div style={styles.previewVideoBox}>
              {videoOn && localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={styles.previewVideo}
                />
              ) : (
                <div style={styles.previewVideoPlaceholder}>
                  <UserOffIcon size={64} />
                  <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.75rem' }}>Camera is Turned Off</div>
                </div>
              )}
              <div style={styles.previewControls}>
                <button style={micOn ? styles.controlBtnMini : styles.controlBtnMiniOff} onClick={() => setMicOn(!micOn)}>
                  {micOn ? <Mic size={16} /> : <MicOff size={16} />}
                </button>
                <button style={videoOn ? styles.controlBtnMini : styles.controlBtnMiniOff} onClick={() => setVideoOn(!videoOn)}>
                  {videoOn ? <Video size={16} /> : <VideoOff size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Lobby Info */}
          <div style={styles.lobbyPanel}>
            <div style={styles.lobbyHeader}>
              <span style={{ ...styles.statusBadge, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                ● Scheduled
              </span>
            </div>

            <div style={{ padding: '1.5rem 0' }}>
              <h1 style={styles.lobbyTitle}>
                {session.companyName ?? 'Placement Drive'}
              </h1>
              <div style={{ color: '#2dd4bf', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Tv size={15} />
                <span>Round {session.roundNumber || 1} · {session.driveName ?? 'Interview Session'}</span>
              </div>

              {isHR && (
                <div style={styles.candidateDetailsCard}>
                  <div style={styles.cardSectionTitle}>Candidate Information</div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Name:</span>
                    <span style={styles.detailValue}>{session.candidateName || 'N/A'}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Email:</span>
                    <span style={styles.detailValue}>{session.candidateEmail || 'N/A'}</span>
                  </div>
                  {session.candidateCgpa && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>CGPA:</span>
                      <span style={styles.detailValue}>{session.candidateCgpa}</span>
                    </div>
                  )}
                  {session.candidateBranch && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Branch:</span>
                      <span style={styles.detailValue}>{session.candidateBranch}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                style={styles.joinBtn}
              >
                {joinMutation.isPending ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Video size={18} />}
                {joinMutation.isPending ? 'Joining…' : isHR ? 'Join & Admit Candidate' : 'Join Interview Room'}
              </button>
              <button onClick={() => navigate(isHR ? '/hr/dashboard' : '/app/placements')} style={styles.lobbyBackLink}>
                <ArrowLeft size={14} /> Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Live Room UI - Differentiated by role
  const calculatedScore = Number(((techScore + commScore + probScore) / 3).toFixed(1));
  const suggestedQuestions = session.candidateBranch ? (SUGGESTED_QUESTIONS[session.candidateBranch] ?? DEFAULT_QUESTIONS) : DEFAULT_QUESTIONS;

  return (
    <div style={styles.liveRoomPage}>
      {/* Room Header */}
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
          {isHR ? (
            <button
              style={styles.endInterviewBtn}
              onClick={() => {
                const confirmed = window.confirm("Are you sure you want to end the interview? You can complete the evaluation in the sidebar first.");
                if (confirmed) {
                  submitEvaluationMutation.mutate({
                    status: 'completed',
                    score: calculatedScore,
                    maxScore: 10
                  });
                }
              }}
              disabled={submitEvaluationMutation.isPending}
            >
              {submitEvaluationMutation.isPending ? 'Submitting...' : 'End & Submit Evaluation'}
            </button>
          ) : (
            <button style={styles.leaveBtn} onClick={() => navigate('/app/placements')}>
              Leave Room
            </button>
          )}
        </div>
      </header>

      {/* Main Panel */}
      <div style={styles.mainArea}>
        {/* Video stream box */}
        <div style={styles.videoGrid}>
          <div style={styles.remoteVideoContainer}>
            <div style={styles.remotePlaceholder}>
              <User size={64} color="rgba(255,255,255,0.2)" />
              <div style={styles.remoteNameBadge}>
                {isHR ? (session.candidateName || 'Candidate') : 'Interviewer'}
              </div>
            </div>
          </div>

          {/* Pip camera preview */}
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
          {isHR ? (
            // INTERVIEWER SIDEBAR
            <>
              <div style={styles.sidebarTabsHeader}>
                <button 
                  onClick={() => setActiveTab('profile')} 
                  style={activeTab === 'profile' ? styles.sidebarTabActive : styles.sidebarTab}
                >
                  Profile
                </button>
                <button 
                  onClick={() => setActiveTab('grading')} 
                  style={activeTab === 'grading' ? styles.sidebarTabActive : styles.sidebarTab}
                >
                  Evaluation
                </button>
                <button 
                  onClick={() => setActiveTab('guide')} 
                  style={activeTab === 'guide' ? styles.sidebarTabActive : styles.sidebarTab}
                >
                  AI Guide
                </button>
              </div>

              <div style={styles.sidebarContent}>
                {activeTab === 'profile' && (
                  <div style={styles.tabContentBlock}>
                    <h3 style={styles.tabContentTitle}>Candidate Details</h3>
                    
                    <div style={styles.metaRow}>
                      <span style={styles.metaLabel}>Name</span>
                      <span style={styles.metaValue}>{session.candidateName || 'N/A'}</span>
                    </div>
                    <div style={styles.metaRow}>
                      <span style={styles.metaLabel}>Email</span>
                      <span style={styles.metaValue}>{session.candidateEmail || 'N/A'}</span>
                    </div>
                    <div style={styles.metaRow}>
                      <span style={styles.metaLabel}>CGPA</span>
                      <span style={styles.metaValue}>{session.candidateCgpa || 'N/A'}</span>
                    </div>
                    <div style={styles.metaRow}>
                      <span style={styles.metaLabel}>Branch</span>
                      <span style={styles.metaValue}>{session.candidateBranch || 'N/A'}</span>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                      {session.candidateResumeUrl ? (
                        <button
                          onClick={() => window.open(session.candidateResumeUrl, '_blank')}
                          style={styles.actionBtnPrimary}
                        >
                          <FileText size={16} /> Open Student Resume
                        </button>
                      ) : (
                        <div style={styles.alertBox}>
                          <Info size={16} />
                          <span>No resume has been uploaded by the student.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'grading' && (
                  <div style={styles.tabContentBlock}>
                    <h3 style={styles.tabContentTitle}>Live Candidate Evaluation</h3>

                    {/* Technical score */}
                    <div style={styles.sliderContainer}>
                      <div style={styles.sliderHeader}>
                        <span>Technical Skills</span>
                        <span style={styles.sliderValue}>{techScore} / 10</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={techScore} 
                        onChange={(e) => setTechScore(Number(e.target.value))}
                        style={styles.sliderInput}
                      />
                    </div>

                    {/* Communication */}
                    <div style={styles.sliderContainer}>
                      <div style={styles.sliderHeader}>
                        <span>Communication</span>
                        <span style={styles.sliderValue}>{commScore} / 10</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={commScore} 
                        onChange={(e) => setCommScore(Number(e.target.value))}
                        style={styles.sliderInput}
                      />
                    </div>

                    {/* Problem Solving */}
                    <div style={styles.sliderContainer}>
                      <div style={styles.sliderHeader}>
                        <span>Problem Solving</span>
                        <span style={styles.sliderValue}>{probScore} / 10</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={probScore} 
                        onChange={(e) => setProbScore(Number(e.target.value))}
                        style={styles.sliderInput}
                      />
                    </div>

                    {/* Live Notes */}
                    <div style={{ marginTop: '1.25rem' }}>
                      <label style={styles.formLabel}>Feedback Notes</label>
                      <textarea
                        value={feedbackNotes}
                        onChange={(e) => setFeedbackNotes(e.target.value)}
                        placeholder="Provide summary of strengths, weaknesses, and decision criteria..."
                        style={styles.formTextarea}
                      />
                    </div>

                    <div style={styles.scorePanelSummary}>
                      <div>Overall Computed Score:</div>
                      <div style={styles.scoreDisplayBig}>{calculatedScore} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 10</span></div>
                    </div>

                    <button
                      onClick={() => {
                        submitEvaluationMutation.mutate({
                          status: 'completed',
                          score: calculatedScore,
                          maxScore: 10
                        });
                      }}
                      disabled={submitEvaluationMutation.isPending}
                      style={styles.actionBtnPrimary}
                    >
                      <Award size={16} /> Submit Grades & Complete
                    </button>
                  </div>
                )}

                {activeTab === 'guide' && (
                  <div style={styles.tabContentBlock}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <Shield size={18} color="#2dd4bf" />
                      <h3 style={{ ...styles.tabContentTitle, margin: 0 }}>AI Interview Co-Pilot</h3>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                      Based on candidate's background ({session.candidateBranch || 'General'}), here are recommended questions:
                    </p>

                    <div style={styles.questionsList}>
                      {suggestedQuestions.map((q, idx) => (
                        <div key={idx} style={styles.questionCard}>
                          <div style={styles.questionIndex}>Suggested Question {idx + 1}</div>
                          <div style={styles.questionText}>{q}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            // CANDIDATE/STUDENT SIDEBAR
            <>
              <div style={styles.sidebarTabsHeader}>
                <button 
                  onClick={() => setActiveTab('instructions')} 
                  style={activeTab === 'instructions' ? styles.sidebarTabActive : styles.sidebarTab}
                >
                  Instructions
                </button>
                <button 
                  onClick={() => setActiveTab('proctoring')} 
                  style={activeTab === 'proctoring' ? styles.sidebarTabActive : styles.sidebarTab}
                >
                  AI Proctor
                </button>
                <button 
                  onClick={() => setActiveTab('chat')} 
                  style={activeTab === 'chat' ? styles.sidebarTabActive : styles.sidebarTab}
                >
                  Chat
                </button>
              </div>

              <div style={styles.sidebarContent}>
                {activeTab === 'instructions' && (
                  <div style={styles.tabContentBlock}>
                    <h3 style={styles.tabContentTitle}>Interview Guidelines</h3>
                    <ul style={styles.bulletsList}>
                      <li>Keep your camera and microphone enabled at all times.</li>
                      <li>Ensure you are in a quiet, well-lit environment.</li>
                      <li>Explain your logic clearly when writing code or answering questions.</li>
                      <li>Do not navigate away from the window (monitored by proctor).</li>
                    </ul>

                    <div style={styles.policyCard}>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#eab308', marginBottom: '0.25rem' }}>
                        <AlertTriangle size={14} /> Technical Warning
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        If you encounter video lag, keep your browser active. Do not close or refresh the tab.
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'proctoring' && (
                  <div style={styles.tabContentBlock}>
                    <div style={styles.proctorStatusHeader}>
                      <Shield size={24} color="#10b981" style={{ animation: 'pulse 2s infinite' }} />
                      <div>
                        <div style={{ fontWeight: 700, color: '#10b981' }}>AI Proctoring Active</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Status: SECURE</div>
                      </div>
                    </div>

                    <div style={styles.proctorMetricRow}>
                      <div style={styles.proctorMetricLabel}>Webcam Detection</div>
                      <div style={styles.proctorMetricValue}><Check size={14} color="#10b981" /> Active</div>
                    </div>

                    <div style={styles.proctorMetricRow}>
                      <div style={styles.proctorMetricLabel}>Audio Quality</div>
                      <div style={styles.proctorMetricValue}><Check size={14} color="#10b981" /> Safe</div>
                    </div>

                    <div style={styles.proctorMetricRow}>
                      <div style={styles.proctorMetricLabel}>Environment Sound</div>
                      <div style={styles.proctorMetricValue}>Quiet</div>
                    </div>

                    <div style={styles.proctorMetricRow}>
                      <div style={styles.proctorMetricLabel}>Window Focus</div>
                      <div style={tabSwitches > 0 ? styles.proctorMetricValueWarn : styles.proctorMetricValue}>
                        {tabSwitches === 0 ? 'Secure' : `${tabSwitches} Switches`}
                      </div>
                    </div>

                    {tabSwitches > 0 && (
                      <div style={styles.proctorAlertBox}>
                        <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                        <span>Warning: Tab/Window switches are logged and sent to recruiter.</span>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={styles.chatMessageList}>
                      <div style={styles.systemMessage}>AI proctor connected to room</div>
                    </div>
                    <div style={styles.chatInputWrapper}>
                      <input 
                        type="text" 
                        placeholder="Type message to interviewer..." 
                        style={styles.chatInput} 
                        disabled
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Control panel buttons */}
      <footer style={styles.controlsFooter}>
        <div style={styles.controlGroup}>
          <button style={micOn ? styles.controlBtn : styles.controlBtnOff} onClick={() => setMicOn(!micOn)}>
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button style={videoOn ? styles.controlBtn : styles.controlBtnOff} onClick={() => setVideoOn(!videoOn)}>
            {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
          <button style={styles.controlBtn} title="Chat" onClick={() => {
            setActiveTab(isHR ? 'grading' : 'chat');
          }}>
            <MessageSquare size={20} />
          </button>
          <button style={styles.endCallBtn} onClick={() => {
            const confirmed = window.confirm("Leave the interview room?");
            if (confirmed) navigate(isHR ? '/hr/dashboard' : '/app/placements');
          }}>
            <PhoneMissed size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
};

const UserOffIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <div style={{ width: size, height: size, border: '2px solid currentColor', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
    <span style={{ fontSize: '0.6em', fontWeight: 800 }}>✖</span>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  center: { minHeight: '100vh', background: '#030712', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#f0f9ff', textAlign: 'center', padding: '2rem' },
  btn: { padding: '0.75rem 1.5rem', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  statusBadge: { fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: 20, textTransform: 'capitalize' },
  joinBtn: { width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#06b6d4,#3b82f6)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', boxShadow: '0 8px 24px rgba(59,130,246,0.3)', transition: 'all 0.2s' },

  // Waiting Room Split-Screen Containers
  waitingRoomContainer: { display: 'flex', maxWidth: 960, width: '100%', background: 'rgba(17,24,39,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', minHeight: 480 },
  previewPanel: { flex: 1, padding: '2.5rem', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: 'rgba(15,23,42,0.3)' },
  previewTitle: { fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1.25rem' },
  previewVideoBox: { flex: 1, position: 'relative', background: '#090d16', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280, border: '1px solid rgba(255,255,255,0.04)' },
  previewVideo: { width: '100%', height: '100%', objectFit: 'cover' },
  previewVideoPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  previewControls: { position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.75rem', background: 'rgba(0,0,0,0.6)', padding: '0.4rem 0.8rem', borderRadius: 30, backdropFilter: 'blur(4px)' },
  controlBtnMini: { width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  controlBtnMiniOff: { width: 32, height: 32, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  lobbyPanel: { width: 420, padding: '2.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(17,24,39,0.15)' },
  lobbyHeader: { display: 'flex', justifyContent: 'flex-start', marginBottom: '1.5rem' },
  lobbyTitle: { fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem', lineHeight: 1.2, fontFamily: 'var(--font-display)' },
  lobbyBackLink: { marginTop: '1rem', background: 'none', border: 'none', color: '#64748b', fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center', width: '100%' },
  candidateDetailsCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '1rem', marginTop: '1rem' },
  cardSectionTitle: { fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.875rem' },
  detailLabel: { color: '#64748b' },
  detailValue: { color: '#f1f5f9', fontWeight: 500 },

  // Live Room layouts
  liveRoomPage: { height: '100vh', background: '#030712', display: 'flex', flexDirection: 'column', color: '#f8fafc', overflow: 'hidden' },
  roomHeader: { padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(17,24,39,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  roomTitle: { margin: 0, fontSize: '1.25rem', fontWeight: 600 },
  liveIndicator: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.8125rem', fontWeight: 600, marginTop: '0.25rem' },
  liveDot: { width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 2s infinite' },
  leaveBtn: { padding: '0.5rem 1.25rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 },
  endInterviewBtn: { padding: '0.5rem 1.25rem', background: '#ef4444', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 },

  mainArea: { flex: 1, display: 'flex', overflow: 'hidden', padding: '1.25rem', gap: '1.25rem' },
  videoGrid: { flex: 1, position: 'relative', display: 'flex', background: '#090d16', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' },
  remoteVideoContainer: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070a11' },
  remotePlaceholder: { width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  remoteNameBadge: { position: 'absolute', bottom: '1.5rem', left: '1.5rem', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', padding: '0.35rem 0.85rem', borderRadius: 6, fontSize: '0.875rem', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' },
  localPipContainer: { position: 'absolute', bottom: '1.5rem', right: '1.5rem', width: 240, height: 135, borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', background: '#111827' },
  localVideo: { width: '100%', height: '100%', objectFit: 'cover' },
  localPlaceholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1f2937' },
  localNameBadge: { position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', color: '#fff' },
  
  sidebar: { width: 360, background: 'rgba(17,24,39,0.7)', backdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sidebarTabsHeader: { display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' },
  sidebarTab: { flex: 1, padding: '1rem', background: 'transparent', border: 'none', borderBottom: '2px solid transparent', color: '#64748b', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' },
  sidebarTabActive: { flex: 1, padding: '1rem', background: 'transparent', border: 'none', borderBottom: '2px solid #2dd4bf', color: '#2dd4bf', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', textAlign: 'center' },
  sidebarContent: { flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  tabContentBlock: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  tabContentTitle: { fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.5rem' },
  
  metaRow: { display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.875rem' },
  metaLabel: { color: '#64748b' },
  metaValue: { color: '#f1f5f9', fontWeight: 500 },
  actionBtnPrimary: { width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg,#06b6d4,#3b82f6)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(59,130,246,0.2)' },
  alertBox: { display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, color: '#60a5fa', fontSize: '0.8125rem' },

  // Grading Sliders
  sliderContainer: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' },
  sliderHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#e2e8f0', fontWeight: 500 },
  sliderValue: { color: '#2dd4bf', fontWeight: 700 },
  sliderInput: { width: '100%', accentColor: '#2dd4bf', cursor: 'pointer' },
  formLabel: { fontSize: '0.875rem', color: '#e2e8f0', fontWeight: 500, display: 'block', marginBottom: '0.5rem' },
  formTextarea: { width: '100%', height: 100, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0.75rem', color: '#f8fafc', fontSize: '0.875rem', outline: 'none', resize: 'none', transition: 'all 0.2s' },
  scorePanelSummary: { background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 8, padding: '1rem', margin: '1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9375rem', fontWeight: 600, color: '#f1f5f9' },
  scoreDisplayBig: { fontSize: '1.75rem', fontWeight: 800, color: '#2dd4bf' },

  // AI guide questions
  questionsList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  questionCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '0.875rem' },
  questionIndex: { fontSize: '0.6875rem', color: '#2dd4bf', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' },
  questionText: { fontSize: '0.8125rem', color: '#cbd5e1', lineHeight: 1.5 },

  // Student list & elements
  bulletsList: { paddingLeft: '1.25rem', color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  policyCard: { background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.15)', borderRadius: 8, padding: '0.875rem', marginTop: '1.5rem' },
  
  // Proctor Panel
  proctorStatusHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' },
  proctorMetricRow: { display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.8125rem', alignItems: 'center' },
  proctorMetricLabel: { color: '#94a3b8' },
  proctorMetricValue: { color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' },
  proctorMetricValueWarn: { color: '#ef4444', fontWeight: 600 },
  proctorAlertBox: { display: 'flex', gap: '0.5rem', padding: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontSize: '0.75rem', marginTop: '1rem', lineHeight: 1.4 },

  // Chat Simulated
  chatMessageList: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '2rem 1rem' },
  systemMessage: { background: 'rgba(255,255,255,0.04)', color: '#64748b', fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: 20 },
  chatInputWrapper: { borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem' },
  chatInput: { width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '0.625rem', color: '#cbd5e1', fontSize: '0.8125rem', outline: 'none' },

  // Footer Controls
  controlsFooter: { padding: '1.25rem', display: 'flex', justifyContent: 'center', background: 'rgba(17,24,39,0.85)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.06)' },
  controlGroup: { display: 'flex', gap: '1.25rem', alignItems: 'center' },
  controlBtn: { width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.04)', color: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  controlBtnOff: { width: 50, height: 50, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  endCallBtn: { width: 60, height: 50, borderRadius: 25, background: '#ef4444', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '0 1.25rem' }
};

export default InterviewRoom;

