import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Clock, AlertTriangle, ChevronLeft, ChevronRight,
  Flag, CheckCircle, X, Camera, Monitor, Loader2,
  PanelRight, Calculator as CalculatorIcon, Edit3
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { useExamTimer } from '../hooks/useExamTimer';
import { ProctoringEngine, type ProctoringEngineStatus, type ProctoringIncident } from '../lib/proctoring/ProctoringEngine';
import { Calculator } from '../components/features/exam/Calculator';
import { Scratchpad } from '../components/features/exam/Scratchpad';
import { ReportQuestionModal } from '../components/features/exam/ReportQuestionModal';
import './ExamInterface.css';

/* ────────── Types ────────── */
interface Question {
  id: string;
  text: string;
  options: string[];
  marks: number;
  type?: 'mcq' | 'coding' | 'math';
  codingLanguage?: 'javascript' | 'python' | 'cpp' | 'java';
  codeTemplate?: string;
  testCases?: { input: string; output: string }[];
  presentationStyle?: 'numerical' | 'mcq';
  correctAnswerText?: string;
}

type ProctoringEvent = { type: string; message?: string; severity?: string; ts: number };

/* ────────── Proctoring Hud ────────── */
const ProctoringHud: React.FC<{
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: ProctoringEngineStatus;
  alerts: number;
}> = ({ videoRef, status, alerts }) => {
  const statusLabel = status.state === 'running'
    ? 'AI Monitoring Active'
    : status.state === 'loading'
      ? 'Loading AI Models'
      : status.state === 'degraded'
        ? 'Limited Monitoring'
        : status.state === 'error'
          ? 'Camera Unavailable'
          : 'Camera Ready';

  return (
    <div className="proctoring-hud" aria-label="Proctoring camera preview">
      <div className="proctoring-hud-videoWrap">
        <video ref={videoRef} className="proctoring-hud-video" autoPlay muted playsInline />
        <div className="proctoring-hud-scan" />
      </div>
      <div className="proctoring-hud-meta">
        <div>
          <div className="proctoring-hud-title">Secure Camera</div>
          <div className="proctoring-hud-status">
            <span className={`proctoring-hud-dot ${status.state}`} />
            {statusLabel}
          </div>
        </div>
        <div className="proctoring-hud-count">
          <span>{alerts}</span>
          <small>alerts</small>
        </div>
      </div>
      <div className="proctoring-hud-foot">
        <span>{status.faceReady ? 'Face mesh' : 'Face mesh pending'}</span>
        <span>{status.objectReady ? 'Object scan' : 'Object scan pending'}</span>
        <span>{status.fps} FPS</span>
      </div>
    </div>
  );
};

/* ────────── Question Palette ────────── */
const QuestionPalette: React.FC<{
  total: number;
  current: number;
  answers: Record<string, number | string>;
  flagged: Set<string>;
  questions: Question[];
  onJump: (i: number) => void;
}> = ({ total, current, answers, flagged, questions, onJump }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
    <h3 style={{ color: 'var(--text-high)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Question Palette</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
      {Array.from({ length: total }, (_, i) => {
        const q = questions[i];
        const answered = answers[q.id] !== undefined;
        const isFlagged = flagged.has(q.id);
        const isCurrent = i === current;
        let bg = 'var(--surface-highest)';
        if (isCurrent) bg = 'var(--primary-glow)';
        else if (isFlagged) bg = 'var(--warning)';
        else if (answered) bg = 'var(--success)';
        return (
          <button key={i} onClick={() => onJump(i)}
            style={{ aspectRatio: '1', minHeight: 36, minWidth: 36, background: bg, border: 'none', color: isCurrent || answered || isFlagged ? 'var(--bg-app)' : 'var(--text-low)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }}>
            {i + 1}
          </button>
        );
      })}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.725rem', color: 'var(--text-low)' }}>
      {[
        { color: 'var(--primary-glow)', label: 'Current' },
        { color: 'var(--success)', label: 'Answered' },
        { color: 'var(--warning)', label: 'Flagged' },
        { color: 'var(--surface-highest)', label: 'Not Visited' },
      ].map(l => (
        <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 14, height: 14, background: l.color, flexShrink: 0 }} />
          {l.label}
        </div>
      ))}
    </div>
  </div>
);

/* ────────── Vault Lockdown Overlay ────────── */
const VaultLockdownOverlay: React.FC<{
  state: 'idle' | 'closing' | 'locked' | 'opening' | 'completed';
  isReengagement: boolean;
  onInitiate: () => void;
}> = ({ state, isReengagement, onInitiate }) => {
  if (state === 'completed') return null;

  return (
    <div className={`vault-overlay-container ${state}`}>
      {/* Left Metal Door */}
      <div className="vault-door vault-door-left">
        <div style={{ marginRight: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div style={{ color: 'rgba(56, 189, 248, 0.4)', fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace' }}>SECURE</div>
          <div style={{ height: '2px', width: '80px', background: 'rgba(56, 189, 248, 0.2)' }} />
          <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.75rem', letterSpacing: '0.2em' }}>SYSTEM OVERLAY A</div>
        </div>
      </div>

      {/* Right Metal Door */}
      <div className="vault-door vault-door-right">
        <div style={{ marginLeft: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div style={{ color: 'rgba(56, 189, 248, 0.4)', fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace' }}>VAULT</div>
          <div style={{ height: '2px', width: '80px', background: 'rgba(56, 189, 248, 0.2)' }} />
          <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.75rem', letterSpacing: '0.2em' }}>SYSTEM OVERLAY B</div>
        </div>
      </div>

      {/* Central Locking Mechanism */}
      {(state === 'closing' || state === 'locked' || state === 'opening') && (
        <div className="vault-lock-hub">
          <div className="vault-lock-ring">
            <div className="vault-lock-ring-glow" />
            <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {state === 'locked' ? (
                <CheckCircle size={48} style={{ color: '#10b981', filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))' }} />
              ) : (
                <Loader2 size={48} style={{ color: '#38bdf8' }} />
              )}
            </div>
          </div>
          <div className="vault-status-panel">
            <div className="vault-status-title">
              {state === 'locked' ? 'VAULT LOCKED & ENCRYPTED' : 'ENGAGING SECURITY SYSTEM...'}
            </div>
            <div className="vault-status-subtitle">
              {state === 'locked' ? 'ENVIRONMENT SHIELD VERIFIED' : 'ESTABLISHING SECURE ASSESSMENT CONTAINER'}
            </div>
          </div>
        </div>
      )}

      {/* Welcome / Breach Modal when idle */}
      {state === 'idle' && (
        <div className="glass-panel" style={{
          position: 'relative',
          width: 'min(480px, 90vw)',
          padding: '2.5rem',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          borderRadius: '16px',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          zIndex: 9995
        }}>
          <div style={{
            padding: '1rem',
            background: isReengagement ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.1)',
            border: isReengagement ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '50%',
            color: isReengagement ? '#ef4444' : '#38bdf8',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isReengagement ? <AlertTriangle size={36} /> : <CheckCircle size={36} />}
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'white', margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>
              {isReengagement ? 'Assessment Vault Interrupted' : 'Lockdown Mode Required'}
            </h2>
            <p style={{ color: 'rgba(241, 245, 249, 0.7)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              {isReengagement
                ? 'Your session exited fullscreen mode. To comply with security guidelines, you must re-lock the vault immediately to continue.'
                : 'To ensure examination integrity, this assessment must be taken in a secure fullscreen container. Click below to verify hardware links and lock down your environment.'}
            </p>
          </div>
          <Button
            variant="primary"
            fullWidth
            onClick={onInitiate}
            style={{
              padding: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              background: isReengagement ? '#ef4444' : 'var(--primary-glow)',
              boxShadow: isReengagement ? '0 4px 15px rgba(239, 68, 68, 0.3)' : '0 4px 15px rgba(56, 189, 248, 0.3)'
            }}
          >
            {isReengagement ? 'Re-engage Secure Vault' : 'Activate Secure Vault'}
          </Button>
        </div>
      )}
    </div>
  );
};

/* Friendly mapper for warnings */
const getFriendlyWarning = (type: string, originalMessage?: string) => {
  const t = type.toLowerCase();
  if (t.includes('face_not_detected') || t.includes('no_face') || t.includes('no-face') || t.includes('face not detected')) {
    return {
      title: 'Face Alignment Needed',
      message: 'Please ensure you are centered and fully visible in the camera view.',
    };
  }
  if (t.includes('multiple_faces') || t.includes('multiple-faces') || t.includes('multiple faces')) {
    return {
      title: 'Keep Room Private',
      message: 'Multiple people detected. Please make sure you are alone during the exam session.',
    };
  }
  if (t.includes('gaze') || t.includes('look') || t.includes('gaze_deviation')) {
    return {
      title: 'Focus Check',
      message: 'We noticed your gaze drifted. Please focus on the screen to avoid automatic flags.',
    };
  }
  if (t.includes('tab_switch') || t.includes('tab switch') || t.includes('tab-switch')) {
    return {
      title: 'Navigation Restricted',
      message: 'Please keep this browser window active. Switching tabs triggers a security flag.',
    };
  }
  if (t.includes('fullscreen_exit') || t.includes('fullscreen exit')) {
    return {
      title: 'Lockdown Interrupted',
      message: 'You have exited full-screen mode. Please re-engage full screen to continue.',
    };
  }
  if (t.includes('copy') || t.includes('paste') || t.includes('clipboard') || t.includes('cut')) {
    return {
      title: 'Shortcut Restricted',
      message: 'Copying and pasting is not permitted during the exam. Please type your answers.',
    };
  }
  if (t.includes('right_click') || t.includes('context_menu') || t.includes('right-click')) {
    return {
      title: 'Interaction Blocked',
      message: 'Right-click is disabled to protect exam content. Please use standard controls.',
    };
  }
  return {
    title: 'Security Alert',
    message: originalMessage || 'A monitoring event was recorded. Please remain focused.',
  };
};

/* ────────── Exam Interface ────────── */
export const ExamInterface: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  // ── Start Attempt (fires on mount) ──
  const { data: attemptData, isLoading: startingExam, isError: startExamError, error: startExamFailure } = useQuery({
    queryKey: ['exam-attempt', examId],
    queryFn: async () => {
      const res = await api.post(`/exams/${examId}/attempts/start`);
      return res.data.data ?? res.data;
    },
    enabled: !!examId,
    staleTime: Infinity,
    retry: false,
  });

  const questions: Question[] = attemptData?.questions ?? [];
  const attemptId: string = attemptData?.attemptId ?? '';
  const examTitle: string = attemptData?.examTitle ?? 'Exam';
  const DURATION = attemptData?.durationSeconds ?? 90 * 60;

  // ── Save answer mutation (auto-save + on change) ──
  const saveMut = useMutation({
    mutationFn: ({ questionId, selectedOption }: { questionId: string; selectedOption: number | string }) =>
      api.patch(`/exams/${examId}/attempts/${attemptId}/answers`, { questionId, selectedOption }),
    onError: () => {},
  });

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [proctoringEvents, setProctoringEvents] = useState<ProctoringEvent[]>([]);
  const [proctoringStatus, setProctoringStatus] = useState<ProctoringEngineStatus>({
    state: 'idle',
    fps: 2,
    faceReady: false,
    objectReady: false,
  });
  const [, setTabSwitchWarning] = useState(false);
  const [aiWarnings, setAiWarnings] = useState<{ count: number; max: number }>({ count: 0, max: 5 });
  const [terminated, setTerminated] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Vault lockdown states
  const [isVaultLocked, setIsVaultLocked] = useState(false);
  const [vaultAnimationState, setVaultAnimationState] = useState<'idle' | 'closing' | 'locked' | 'opening' | 'completed'>('idle');
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string; severity: 'low' | 'medium' | 'high' | 'critical'; ts: number }[]>([]);

  // ── Frame capture refs ──
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const aiMonitoringRef = useRef<boolean>(true);
  const proctoringEngineRef = useRef<ProctoringEngine | null>(null);
  const isSubmittingRef = useRef<boolean>(false);

  // Toast dispatch
  const showToast = useCallback((type: string, message?: string, severity: string = 'medium') => {
    const friendly = getFriendlyWarning(type, message);
    const newToast = {
      id: Math.random().toString(36).substring(2, 9),
      title: friendly.title,
      message: friendly.message,
      severity: severity.toLowerCase() as any,
      ts: Date.now()
    };
    setToasts(prev => {
      const duplicate = prev.some(t => t.message === friendly.message && Date.now() - t.ts < 2000);
      if (duplicate) return prev;
      return [...prev, newToast];
    });
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  }, []);

  // ── Submit mutation ──
  const submitMut = useMutation({
    mutationFn: () => api.post(`/exams/${examId}/attempts/${attemptId}/submit`),
    onSuccess: () => {
      setSubmitted(true);
      setShowSubmitModal(false);
    },
    onError: (err: any) => {
      isSubmittingRef.current = false;
      showToast('submit_error', err.response?.data?.message || err.message || 'Submission failed. Please try again.', 'HIGH');
    }
  });

  // ── Fetch Result (after submission) ──
  const { data: resultData, isLoading: loadingResult } = useQuery({
    queryKey: ['exam-result', attemptId],
    queryFn: async () => {
      const res = await api.get(`/exams/results/${attemptId}`);
      return res.data.data ?? res.data;
    },
    enabled: submitted && !!attemptId,
  });

  const handleSubmit = useCallback(() => {
    if (submitted || submitMut.isPending) return;
    isSubmittingRef.current = true;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (attemptId) {
      submitMut.mutate();
    } else {
      setSubmitted(true);
      setShowSubmitModal(false);
    }
  }, [attemptId, submitMut, submitted]);

  // Use timer hook
  const { timeLeft } = useExamTimer(
    !submitted && !startingExam && attemptData ? attemptId : null, 
    handleSubmit, 
    false, 
    DURATION
  );

  // ── Terminated redirect ──
  useEffect(() => {
    if (terminated) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      navigate('/app/exams', { state: { terminated: true, examTitle } });
    }
  }, [terminated, navigate, examTitle]);

  // Sync proctoring sockets
  useEffect(() => {
    if (submitted || startingExam || !attemptData || !attemptId) return;

    const trackingSocket = connectSocket('/tracking');
    trackingSocket.emit('join:tracking', { attemptId });

    const onFlagAlert = (alert: any) => {
      setProctoringEvents(evs => [...evs, { type: alert.eventType, ts: new Date().getTime() }]);
      showToast(alert.eventType, alert.message || alert.eventType, alert.severity || 'medium');
    };

    const onWarning = (data: { count: number; max: number }) => {
      setAiWarnings(data);
      showToast('gaze_deviation', `Gaze warning ${data.count} of ${data.max}. Please keep your eyes on the screen.`, 'HIGH');
    };

    const onTerminated = () => {
      setTerminated(true);
    };

    trackingSocket.on('flag:alert', onFlagAlert);
    trackingSocket.on('proctoring:warning', onWarning);
    trackingSocket.on('proctoring:terminated', onTerminated);

    return () => {
      trackingSocket.off('flag:alert', onFlagAlert);
      trackingSocket.off('proctoring:warning', onWarning);
      trackingSocket.off('proctoring:terminated', onTerminated);
      disconnectSocket('/tracking');
    };
  }, [submitted, startingExam, attemptData, attemptId, showToast]);

  // Proctoring: track tab visibility change
  useEffect(() => {
    const onVisibilityChange = () => {
      if (isSubmittingRef.current || submitted) return;
      if (document.hidden && !submitted && attemptId) {
        setTabSwitchWarning(true);
        setTimeout(() => setTabSwitchWarning(false), 5000);
        
        const trackingSocket = connectSocket('/tracking');
        trackingSocket.emit('flag:event', { attemptId, eventType: 'Tab Switch Detected', severity: 'medium' });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [submitted, attemptId]);

  // Proctoring: track context menu (right click attempt)
  useEffect(() => {
    if (submitted || !attemptId) return;
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const trackingSocket = connectSocket('/tracking');
      trackingSocket.emit('flag:event', { attemptId, eventType: 'Right-Click Blocked', severity: 'low' });
      showToast('right_click', 'Right-click is disabled to protect exam layout.', 'LOW');
    };
    document.addEventListener('contextmenu', onContextMenu);
    return () => document.removeEventListener('contextmenu', onContextMenu);
  }, [submitted, attemptId, showToast]);

  const captureEvidenceFrame = useCallback((quality = 0.82) => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return undefined;

    const canvas = canvasRef.current ?? document.createElement('canvas');
    canvasRef.current = canvas;

    const sourceWidth = video.videoWidth || 1280;
    const sourceHeight = video.videoHeight || 720;
    const targetWidth = 1280;
    const targetHeight = 720;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    ctx.drawImage(video, (targetWidth - drawWidth) / 2, (targetHeight - drawHeight) / 2, drawWidth, drawHeight);

    return canvas.toDataURL('image/jpeg', quality);
  }, []);

  const handleAiIncident = useCallback((incident: ProctoringIncident) => {
    if (isSubmittingRef.current || submitted) return;
    const shouldCapture = incident.severity === 'HIGH' || incident.severity === 'CRITICAL';
    const snapshotBase64 = shouldCapture ? captureEvidenceFrame() : undefined;

    setProctoringEvents(evs => [...evs, {
      type: incident.type,
      message: incident.message,
      severity: incident.severity,
      ts: incident.timestamp,
    }]);

    setAiWarnings(prev => ({
      count: Math.min(prev.max, prev.count + (incident.severity === 'LOW' ? 0 : 1)),
      max: prev.max,
    }));

    showToast(incident.type, incident.message, incident.severity);

    api.post('/proctoring/events', {
      attemptId,
      examId,
      type: incident.type,
      severity: incident.severity,
      aiConfidence: incident.confidence,
      gazeDirection: typeof incident.metadata.direction === 'string' ? incident.metadata.direction : undefined,
      snapshotBase64,
      metadata: {
        ...incident.metadata,
        source: 'edge-proctor',
        capturedLocally: Boolean(snapshotBase64),
      },
    }).catch(() => { /* Keep exam running if logging has a transient failure. */ });
  }, [attemptId, captureEvidenceFrame, examId, showToast, submitted]);

  // ── Edge AI Proctoring Loop ──
  useEffect(() => {
    if (submitted || !attemptId) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let heartbeatInterval: any = null;

    const startEdgeProctoring = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (cancelled || !videoRef.current) return;

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const engine = new ProctoringEngine({
          video: videoRef.current,
          onIncident: handleAiIncident,
          onStatusChange: setProctoringStatus,
        });
        proctoringEngineRef.current = engine;
        await engine.initialize();
        if (!cancelled) {
          engine.start();

          api.post('/proctoring/heartbeat', { attemptId }).catch(() => {});
          
          heartbeatInterval = setInterval(() => {
            if (aiMonitoringRef.current && proctoringEngineRef.current) {
              api.post('/proctoring/heartbeat', { attemptId }).catch(() => {});
            }
          }, 20000);
        }
      } catch {
        aiMonitoringRef.current = false;
        setProctoringStatus({
          state: 'error',
          fps: 0,
          faceReady: false,
          objectReady: false,
          lastError: 'Camera permission denied or unavailable',
        });
      }
    };

    startEdgeProctoring();

    return () => {
      cancelled = true;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      proctoringEngineRef.current?.stop();
      proctoringEngineRef.current = null;
      stream?.getTracks().forEach((t) => t.stop());
      if (videoRef.current?.srcObject) {
        const activeStream = videoRef.current.srcObject as MediaStream;
        activeStream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    };

  }, [submitted, attemptId, handleAiIncident]);

  // ── Browser Events Proctoring (Tab Switch, Fullscreen, Clipboard) ──
  useEffect(() => {
    if (submitted || !attemptId || !examId) return;

    const logEvent = (type: string, severity: string, metadata: any) => {
      if (isSubmittingRef.current || submitted) return;
      api.post('/proctoring/events', {
        attemptId,
        examId,
        type,
        severity,
        aiConfidence: 1.0,
        metadata: { ...metadata, timestamp: new Date().toISOString() },
      }).catch(() => {});
    };

    const onVisibilityChange = () => {
      if (isSubmittingRef.current || submitted) return;
      if (document.visibilityState === 'hidden') {
        logEvent('tab_switch', 'HIGH', { action: 'hidden' });
        setProctoringEvents(evs => [...evs, {
          type: 'tab_switch', severity: 'HIGH', message: 'Tab switched or minimized during exam', ts: Date.now()
        }]);
        showToast('tab_switch', 'Tab switched or minimized during exam', 'HIGH');
      }
    };

    const onFullscreenChange = () => {
      if (isSubmittingRef.current || submitted) return;
      if (!document.fullscreenElement) {
        logEvent('fullscreen_exit', 'MEDIUM', { action: 'exit' });
        setProctoringEvents(evs => [...evs, {
          type: 'fullscreen_exit', severity: 'MEDIUM', message: 'Exited fullscreen mode', ts: Date.now()
        }]);
        showToast('fullscreen_exit', 'Exited fullscreen mode', 'MEDIUM');
        setIsVaultLocked(false);
        setVaultAnimationState('idle');
      }
    };

    const onClipboard = (e: ClipboardEvent) => {
      if (isSubmittingRef.current || submitted) return;
      logEvent('copy_paste', 'MEDIUM', { action: e.type });
      setProctoringEvents(evs => [...evs, {
        type: 'copy_paste', severity: 'MEDIUM', message: `Clipboard ${e.type} detected`, ts: Date.now()
      }]);
      showToast('copy_paste', `Clipboard ${e.type} detected`, 'MEDIUM');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('copy', onClipboard);
    document.addEventListener('paste', onClipboard);
    document.addEventListener('cut', onClipboard);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('copy', onClipboard);
      document.removeEventListener('paste', onClipboard);
      document.removeEventListener('cut', onClipboard);
    };
  }, [submitted, attemptId, examId, showToast]);

  const initiateLockdown = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      }
      setVaultAnimationState('closing');
      setTimeout(() => {
        setVaultAnimationState('locked');
        setTimeout(() => {
          setVaultAnimationState('opening');
          setTimeout(() => {
            setVaultAnimationState('completed');
            setIsVaultLocked(true);
          }, 1000);
        }, 1500);
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast('fullscreen_exit', 'Could not establish secure fullscreen mode. Please check browser configurations.');
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isTimeCritical = timeLeft < 10 * 60;

  // Loading screen while starting exam
  if (startingExam) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-glow)' }} />
        <p style={{ color: 'var(--text-low)' }}>Initializing secure exam session...</p>
      </div>
    );
  }

  if (startExamError) {
    const errorDetails = (startExamFailure as any)?.response?.data?.error?.details;
    const existingAttemptId = errorDetails?.attemptId;
    const message = (startExamFailure as any)?.response?.data?.error?.message
      || (startExamFailure as any)?.response?.data?.message
      || 'This exam cannot be started. It may already be completed or outside the allowed window.';
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-panel" style={{ maxWidth: 520, width: '100%', padding: '2rem', textAlign: 'center' }}>
          <AlertTriangle size={36} style={{ color: 'var(--warning)', marginBottom: '1rem' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-high)', margin: '0 0 0.75rem', fontSize: '1.25rem' }}>Exam Locked</h1>
          <p style={{ color: 'var(--text-low)', margin: 0, lineHeight: 1.6 }}>{message}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            {existingAttemptId && (
              <Button variant="primary" onClick={() => navigate(`/app/exams/results/${existingAttemptId}`)}>View My Results</Button>
            )}
            <Button variant="outline" onClick={() => navigate('/app/exams')}>Back to Exams</Button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-high)' }}>No questions available for this exam.</p>
          <Button variant="outline" onClick={() => navigate('/exams')} style={{ marginTop: '1rem' }}>Back to Exams</Button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const answered = Object.keys(answers).length;

  /* ─── Result Screen ─── */
  if (submitted) {
    const pct = answered > 0 && questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0;
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-panel" style={{ maxWidth: 520, width: '100%', padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <CheckCircle size={56} style={{ color: pct >= 60 ? 'var(--success)' : 'var(--error)' }} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-high)', margin: '0 0 0.5rem' }}>Exam Submitted</h1>
            <p style={{ color: 'var(--text-low)', fontSize: '0.9rem' }}>{examTitle}</p>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: pct >= 60 ? 'var(--success)' : 'var(--error)', fontFamily: 'var(--font-display)' }}>{answered}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-lowest)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Answered / {questions.length}</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--surface-highest)', paddingLeft: '2rem' }}>
              {loadingResult ? (
                <div style={{ padding: '0.5rem' }}>Loading verified score...</div>
              ) : resultData ? (
                <>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: resultData.passed ? 'var(--success)' : 'var(--error)', fontFamily: 'var(--font-display)' }}>
                    {resultData.totalScore}/{resultData.maxScore}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-lowest)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Final Score</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: pct >= 60 ? 'var(--success)' : 'var(--error)', fontFamily: 'var(--font-display)' }}>{pct}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-lowest)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Completion</div>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-low)' }}>
            <span>Answered: <strong style={{ color: 'var(--success)' }}>{answered}</strong>/{questions.length}</span>
            <span>Flagged: <strong style={{ color: 'var(--warning)' }}>{flagged.size}</strong></span>
            <span>Proctoring Alerts: <strong style={{ color: 'var(--error)' }}>{proctoringEvents.length}</strong></span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
            <Button variant="primary" fullWidth onClick={() => navigate(`/app/exams/results/${attemptId}`)}>
              View Detailed Results
            </Button>
            <Button variant="outline" fullWidth onClick={() => navigate('/app/exams')}>
              Back to Exams
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Exam Interface ─── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
      {/* Immersive Vault Lockdown Overlay */}
      {!isVaultLocked && (
        <VaultLockdownOverlay
          state={vaultAnimationState}
          isReengagement={proctoringEvents.some(e => e.type === 'fullscreen_exit')}
          onInitiate={initiateLockdown}
        />
      )}

      {/* Glassmorphic Floating Warnings Stack */}
      <div style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        width: '320px',
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => {
          const isDanger = toast.severity === 'high' || toast.severity === 'critical';
          const isWarning = toast.severity === 'medium';
          const borderColor = isDanger ? 'rgba(239, 68, 68, 0.4)' : isWarning ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.4)';
          const glowColor = isDanger ? 'rgba(239, 68, 68, 0.15)' : isWarning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)';
          const iconColor = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8';

          return (
            <div
              key={toast.id}
              className="slide-in"
              style={{
                pointerEvents: 'auto',
                background: 'rgba(15, 23, 42, 0.85)',
                border: `1px solid ${borderColor}`,
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.35), 0 0 15px ${glowColor}`,
                backdropFilter: 'blur(16px)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                color: 'white',
              }}
            >
              <AlertTriangle size={18} style={{ color: iconColor, flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>{toast.title}</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(241, 245, 249, 0.8)', lineHeight: 1.4 }}>{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(241, 245, 249, 0.4)',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Main Interactive Screen layout, blurred if vault is locked */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        filter: !isVaultLocked ? 'blur(15px)' : 'none',
        pointerEvents: !isVaultLocked ? 'none' : 'auto',
        transition: 'filter 0.5s ease',
        height: '100vh'
      }}>
        <ProctoringHud videoRef={videoRef} status={proctoringStatus} alerts={proctoringEvents.length} />

        {/* Top Bar */}
        <div className="exam-topbar" style={{ height: '3.5rem', background: 'var(--surface-container)', borderBottom: '1px solid var(--surface-highest)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
          <div className="exam-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary-glow)', fontSize: '0.9375rem' }}>UGSkill Exam</div>
            <div style={{ borderLeft: '1px solid var(--surface-highest)', paddingLeft: '1rem', color: 'var(--text-low)', fontSize: '0.875rem' }}>{examTitle}</div>
          </div>
          <div className="exam-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isTimeCritical ? 'var(--error)' : 'var(--text-high)', fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700 }}>
              <Clock size={16} style={{ color: isTimeCritical ? 'var(--error)' : 'var(--text-low)' }} />
              {formatTime(timeLeft)}
            </div>
            <div className="exam-ai-status" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-low)', fontSize: '0.8125rem' }}>
              <span style={{
                display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                background: 'var(--success)', animation: 'pulse-dot 2s ease-in-out infinite',
              }} />
              <span style={{ color: 'var(--success)', fontSize: '0.75rem' }}>AI Monitoring Active</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Button
                variant="ghost"
                size="sm"
                style={{ color: showCalculator ? 'var(--primary)' : 'var(--text-low)', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                onClick={() => {
                  setShowCalculator(c => !c);
                  setShowScratchpad(false);
                }}
                title="Calculator"
              >
                <CalculatorIcon size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Calc</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                style={{ color: showScratchpad ? 'var(--primary)' : 'var(--text-low)', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                onClick={() => {
                  setShowScratchpad(s => !s);
                  setShowCalculator(false);
                }}
                title="Scratchpad"
              >
                <Edit3 size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Scribble</span>
              </Button>
              <Button variant="ghost" size="sm" className="exam-palette-toggle" onClick={() => setShowPalette(p => !p)}>
                <PanelRight size={16} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSubmitModal(true)}>Submit Exam</Button>
            </div>
          </div>
        </div>

        <div className="exam-layout">
          {/* Question Area */}
          <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-low)', fontSize: '0.875rem' }}>Question <strong style={{ color: 'var(--text-high)' }}>{current + 1}</strong> of {questions.length}</span>
              <span style={{ color: 'var(--text-low)', fontSize: '0.875rem' }}>{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
            </div>

            {/* Question card */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <p style={{ color: 'var(--text-high)', fontSize: '1.0625rem', lineHeight: 1.7, margin: '0 0 2rem' }}>
                <span style={{ color: 'var(--primary-glow)', fontWeight: 800, marginRight: '0.75rem' }}>Q{current + 1}.</span>
                {q.text}
              </p>

              {(!q.type || q.type === 'mcq' || (q.type === 'math' && q.presentationStyle === 'mcq')) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(q.options || []).map((opt, i) => {
                    const sel = answers[q.id] === i;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setAnswers(a => ({ ...a, [q.id]: i }));
                          if (attemptId) saveMut.mutate({ questionId: q.id, selectedOption: i });
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '1rem 1.5rem',
                          background: sel ? 'rgba(56, 189, 248, 0.08)' : 'var(--surface-well)',
                          border: sel ? '1px solid var(--primary-glow)' : '1px solid var(--surface-highest)',
                          borderRadius: '12px',
                          color: sel ? 'var(--text-high)' : 'var(--text-low)',
                          cursor: 'pointer',
                          fontSize: '0.9375rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1.25rem',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: sel ? '0 4px 20px rgba(56, 189, 248, 0.15)' : 'none',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          if (!sel) {
                            e.currentTarget.style.borderColor = 'var(--primary-glow)';
                            e.currentTarget.style.background = 'var(--surface-container)';
                          }
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'none';
                          if (!sel) {
                            e.currentTarget.style.borderColor = 'var(--surface-highest)';
                            e.currentTarget.style.background = 'var(--surface-well)';
                          }
                        }}
                      >
                        <span style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: sel ? 'var(--primary-glow)' : 'var(--surface-highest)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: sel ? 'var(--bg-app)' : 'var(--text-medium)',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          boxShadow: sel ? '0 0 10px rgba(56, 189, 248, 0.4)' : 'none',
                          transition: 'all 0.2s',
                        }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        {typeof opt === 'object' && opt !== null ? (opt as any).text : opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'coding' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-well)', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--surface-highest)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-low)' }}>
                      Language: <strong style={{ textTransform: 'capitalize', color: 'var(--primary-glow)' }}>{q.codingLanguage || 'javascript'}</strong>
                    </span>
                    <span style={{ fontSize: '0.75rem', background: 'var(--surface-highest)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                      Time limit: 1000ms
                    </span>
                  </div>

                  <div style={{
                    background: '#181824',
                    borderRadius: '12px',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    overflow: 'hidden'
                  }}>
                    {/* IDE Mock Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1.25rem',
                      background: '#11111b',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }}></span>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }}></span>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }}></span>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#888a9e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-glow)' }}></span>
                        index.{q.codingLanguage === 'python' ? 'py' : q.codingLanguage === 'cpp' ? 'cpp' : 'js'}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#565768' }}>
                        UTF-8
                      </span>
                    </div>

                    <div style={{ position: 'relative', display: 'flex', background: '#111216' }}>
                      <textarea
                        style={{
                          width: '100%',
                          minHeight: '320px',
                          fontFamily: '"Fira Code", Consolas, Monaco, "Courier New", Courier, monospace',
                          fontSize: '0.875rem',
                          padding: '1.25rem',
                          background: 'transparent',
                          color: '#f8f8f2',
                          border: 'none',
                          outline: 'none',
                          resize: 'vertical',
                          lineHeight: '1.6',
                          boxSizing: 'border-box',
                          caretColor: 'var(--primary-glow)'
                        }}
                        placeholder="Write your code here..."
                        value={typeof answers[q.id] === 'string' ? answers[q.id] as string : (q.codeTemplate || '')}
                        onChange={e => {
                          const val = e.target.value;
                          setAnswers(a => ({ ...a, [q.id]: val }));
                          if (attemptId) saveMut.mutate({ questionId: q.id, selectedOption: val });
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-well)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--surface-highest)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-high)' }}>Verification Sandbox</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const code = String(answers[q.id] || q.codeTemplate || '');
                          const lang = (q.codingLanguage || 'javascript').toLowerCase();
                          if (lang !== 'javascript' && lang !== 'js') {
                            alert(`Sandbox execution is only available for JavaScript. For ${q.codingLanguage}, your syntax will be evaluated after submission.`);
                            return;
                          }
                          
                          try {
                            let funcName = 'solution';
                            const match = code.match(/function\s+(\w+)\s*\(/);
                            if (match && match[1]) {
                              funcName = match[1];
                            }

                            const testCases = q.testCases || [];
                            let passed = 0;
                            const fn = new Function(`${code}\nreturn ${funcName};`)();

                            for (const tc of testCases) {
                              let args: any[];
                              try {
                                const parsed = JSON.parse(tc.input);
                                args = Array.isArray(parsed) ? parsed : [parsed];
                              } catch {
                                args = [tc.input];
                              }

                              const res = fn(...args);
                              if (String(res).trim() === String(tc.output).trim()) {
                                passed++;
                              }
                            }
                            alert(`Ran ${testCases.length} local test cases.\nPassed: ${passed}/${testCases.length}`);
                          } catch (err: any) {
                            alert(`Runtime Error: ${err.message}`);
                          }
                        }}
                      >
                        Run Code (JS Only)
                      </Button>
                    </div>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', color: 'var(--text-low)' }}>
                      Write a function named matching the template definition to pass parameters.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(q.testCases || []).map((tc, idx) => (
                        <div key={idx} style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem', background: 'var(--surface-highest)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace' }}>
                          <span>Input: <strong style={{ color: 'var(--text-medium)' }}>{tc.input}</strong></span>
                          <span>Expected: <strong style={{ color: 'var(--primary-glow)' }}>{tc.output}</strong></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {q.type === 'math' && q.presentationStyle === 'numerical' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-low)', margin: 0 }}>
                    Please type the exact numerical answer in the field below.
                  </p>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      borderRadius: '10px',
                      background: 'var(--surface-well)',
                      border: '1px solid var(--surface-highest)',
                      color: 'var(--text-high)',
                      fontSize: '1rem',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Type numerical value here (e.g. 42 or 3.14)"
                    value={String(answers[q.id] ?? '')}
                    onChange={e => {
                      const val = e.target.value;
                      setAnswers(a => ({ ...a, [q.id]: val }));
                      if (attemptId) saveMut.mutate({ questionId: q.id, selectedOption: val });
                    }}
                  />
                </div>
              )}
            </div>

            {/* Nav buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button variant="ghost" size="sm" leftIcon={<ChevronLeft size={14} />} onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
                Previous
              </Button>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => setFlagged(f => { const n = new Set(f); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: flagged.has(q.id) ? 'var(--warning)' : 'var(--text-low)', cursor: 'pointer', fontSize: '0.8125rem' }}
                >
                  <Flag size={14} fill={flagged.has(q.id) ? 'currentColor' : 'none'} />
                  {flagged.has(q.id) ? 'Flagged' : 'Flag for Review'}
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: '0.8125rem', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-low)'}
                >
                  <AlertTriangle size={14} />
                  Report Issue
                </button>
              </div>
              <Button variant={current === questions.length - 1 ? 'primary' : 'ghost'} size="sm" rightIcon={<ChevronRight size={14} />} onClick={() => current === questions.length - 1 ? setShowSubmitModal(true) : setCurrent(c => c + 1)}>
                {current === questions.length - 1 ? 'Review & Submit' : 'Next'}
              </Button>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className={`exam-sidebar ${showPalette ? 'open' : ''}`} style={{ width: 240, background: 'var(--surface-container)', borderLeft: '1px solid var(--surface-highest)', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', flexShrink: 0 }}>
            <div className="glass-panel" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-lowest)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Progress</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-display)' }}>{answered}<span style={{ fontSize: '0.875rem', color: 'var(--text-low)' }}>/{questions.length}</span></div>
              <div style={{ height: 4, background: 'var(--surface-highest)', borderRadius: 2, marginTop: '0.5rem', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(answered / questions.length) * 100}%`, background: 'var(--success)', transition: 'width 0.3s' }} />
              </div>
            </div>

            <QuestionPalette total={questions.length} current={current} answers={answers} flagged={flagged} questions={questions} onJump={setCurrent} />
          </div>
        </div>

        {/* Submit Modal */}
        {showSubmitModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,10,15,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
            <div className="glass-panel" style={{ width: 440, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', margin: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-high)', margin: 0, fontSize: '1.125rem' }}>Submit Exam?</h2>
                <button onClick={() => setShowSubmitModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', padding: '1rem', display: 'flex', gap: '0.75rem' }}>
                <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
                <p style={{ color: 'var(--text-low)', fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>
                  You have answered <strong style={{ color: 'var(--text-high)' }}>{answered}</strong> of {questions.length} questions.
                  {flagged.size > 0 && <> <strong style={{ color: 'var(--warning)' }}>{flagged.size}</strong> flagged for review.</>} This action cannot be undone.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button variant="ghost" fullWidth onClick={() => setShowSubmitModal(false)}>Continue Exam</Button>
                <Button variant="primary" fullWidth onClick={handleSubmit}>Confirm Submit</Button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Calculator */}
        {showCalculator && (
          <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 400 }}>
            <Calculator onClose={() => setShowCalculator(false)} />
          </div>
        )}

        {/* Floating Scratchpad */}
        {showScratchpad && (
          <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 400 }}>
            <Scratchpad onClose={() => setShowScratchpad(false)} />
          </div>
        )}

        {/* Report Question Modal */}
        {showReportModal && (
          <ReportQuestionModal
            examId={examId!}
            attemptId={attemptId}
            questionId={q.id}
            onClose={() => setShowReportModal(false)}
          />
        )}
      </div>
    </div>
  );
};
