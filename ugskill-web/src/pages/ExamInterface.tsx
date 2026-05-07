import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Clock, AlertTriangle, ChevronLeft, ChevronRight,
  Flag, CheckCircle, X, Camera, Monitor, Loader2,
  PanelRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { useExamTimer } from '../hooks/useExamTimer';
import './ExamInterface.css';

/* ────────── Types ────────── */
interface Question {
  id: string;
  text: string;
  options: string[];
  marks: number;
}

type ProctoringEvent = { type: string; ts: number };

/* ────────── Proctoring Overlay ────────── */
const ProctoringBanner: React.FC<{ events: ProctoringEvent[] }> = ({ events }) => {
  const recent = events[events.length - 1];
  if (!recent || Date.now() - recent.ts > 4000) return null;
  return (
    <div style={{ position: 'fixed', top: '4.5rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)', backdropFilter: 'blur(8px)', color: '#ef4444', padding: '0.5rem 1.25rem', fontSize: '0.8125rem', fontWeight: 600, zIndex: 999, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <AlertTriangle size={14} /> Proctoring Alert: {recent.type}
    </div>
  );
};

/* ────────── Question Palette ────────── */
const QuestionPalette: React.FC<{
  total: number;
  current: number;
  answers: Record<string, number>;
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

/* ────────── Exam Interface ────────── */
export const ExamInterface: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  // ── Start Attempt (fires on mount) ──
  const { data: attemptData, isLoading: startingExam } = useQuery({
    queryKey: ['exam-attempt', examId],
    queryFn: async () => {
      const res = await api.post(`/exams/${examId}/attempts/start`);
      return res.data.data ?? res.data;
      // Shape: { attemptId, questions[], durationSeconds, examTitle }
    },
    enabled: !!examId,
    staleTime: Infinity, // never refetch — we only want to start once
    retry: false,
  });

  const questions: Question[] = attemptData?.questions ?? [];
  const attemptId: string = attemptData?.attemptId ?? '';
  const examTitle: string = attemptData?.examTitle ?? 'Exam';
  const DURATION = attemptData?.durationSeconds ?? 90 * 60;

  // ── Save answer mutation (auto-save + on change) ──
  const saveMut = useMutation({
    mutationFn: ({ questionId, selectedOption }: { questionId: string; selectedOption: number }) =>
      api.patch(`/exams/${examId}/attempts/${attemptId}/answers`, { questionId, selectedOption }),
    // Silently fail — answers also kept in local state
    onError: () => {},
  });

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [proctoringEvents, setProctoringEvents] = useState<ProctoringEvent[]>([]);
  const [, setTabSwitchWarning] = useState(false);
  const [aiWarnings, setAiWarnings] = useState<{ count: number; max: number }>({ count: 0, max: 5 });
  const [terminated, setTerminated] = useState(false);

  // ── Frame capture refs ──
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiMonitoringRef = useRef<boolean>(true);

  // ── Submit mutation ──
  const submitMut = useMutation({
    mutationFn: () => api.post(`/exams/${examId}/attempts/${attemptId}/submit`),
    onSuccess: () => {
      setSubmitted(true);
      setShowSubmitModal(false);
    },
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
    if (attemptId) {
      submitMut.mutate();
    } else {
      setSubmitted(true);
      setShowSubmitModal(false);
    }
  }, [attemptId, submitMut]);

  // Use extracted exam timer
  const { timeLeft } = useExamTimer(!submitted && !startingExam && attemptData ? attemptId : null, handleSubmit);

  // ── Terminated redirect ──
  useEffect(() => {
    if (terminated) {
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
    };

    const onWarning = (data: { count: number; max: number }) => {
      setAiWarnings(data);
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
  }, [submitted, startingExam, attemptData, attemptId]);

  // Proctoring: track tab visibility change
  useEffect(() => {
    const onVisibilityChange = () => {
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
    };
    document.addEventListener('contextmenu', onContextMenu);
    return () => document.removeEventListener('contextmenu', onContextMenu);
  }, [submitted, attemptId]);

  // ── Frame Capture Loop (5s interval) ──
  useEffect(() => {
    if (submitted || !attemptId) return;

    const startFrameCapture = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!videoRef.current) {
          const v = document.createElement('video');
          v.setAttribute('playsinline', '');
          v.muted = true;
          v.style.position = 'fixed';
          v.style.top = '-9999px';
          v.style.left = '-9999px';
          v.style.width = '1px';
          v.style.height = '1px';
          v.style.opacity = '0';
          v.style.pointerEvents = 'none';
          document.body.appendChild(v);
          v.srcObject = stream;
          await v.play();
          videoRef.current = v;
        }
      } catch {
        aiMonitoringRef.current = false;
        return;
      }

      if (!canvasRef.current) {
        const c = document.createElement('canvas');
        c.width = 320;
        c.height = 240;
        canvasRef.current = c;
      }

      const captureAndSend = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = canvas.toDataURL('image/jpeg', 0.6);

        api.post('/proctoring/analyze-frame', {
          attemptId,
          examId,
          frame,
          capturedAt: new Date().toISOString(),
        }).catch(() => { /* fire-and-forget */ });
      };

      frameIntervalRef.current = setInterval(captureAndSend, 5000);
    };

    startFrameCapture();

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream | null;
        stream?.getTracks().forEach((t) => t.stop());
        videoRef.current.remove();
        videoRef.current = null;
      }
    };
  }, [submitted, attemptId]);


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
  void questions.reduce((s, q) => s + q.marks, 0); // maxMarks used for future score display

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
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: (resultData.score / resultData.maxScore) >= 0.6 ? 'var(--success)' : 'var(--error)', fontFamily: 'var(--font-display)' }}>
                    {resultData.score}/{resultData.maxScore}
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
          <Button variant="primary" fullWidth leftIcon={<ChevronLeft size={15} />} onClick={() => navigate('/exams')}>
            Back to Exams
          </Button>
        </div>
      </div>
    );
  }

  /* ─── Exam Interface ─── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
      <ProctoringBanner events={proctoringEvents} />

      {/* AI Gaze Warning Banner */}
      {aiWarnings.count > 0 && (
        <div style={{
          position: 'fixed', top: '3.5rem', left: 0, right: 0,
          background: 'rgba(239,68,68,0.92)', backdropFilter: 'blur(8px)',
          color: '#fff', padding: '0.625rem 2rem', zIndex: 998,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '0.875rem', fontWeight: 600,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} />
            <span>Gaze violation detected. Repeated violations may terminate your exam.</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8125rem', opacity: 0.9 }}>
            {aiWarnings.count} of {aiWarnings.max} warnings used
          </span>
        </div>
      )}

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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {q.options.map((opt, i) => {
                const sel = answers[q.id] === i;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setAnswers(a => ({ ...a, [q.id]: i }));
                      // Auto-save to backend
                      if (attemptId) saveMut.mutate({ questionId: q.id, selectedOption: i });
                    }}
                    style={{
                      textAlign: 'left', padding: '0.875rem 1.25rem', background: sel ? 'var(--primary-low)' : 'var(--surface-well)',
                      border: sel ? '1px solid var(--primary-glow)' : '1px solid var(--surface-highest)',
                      color: sel ? 'var(--text-high)' : 'var(--text-low)', cursor: 'pointer', fontSize: '0.9375rem',
                      display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--outline)'; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--surface-highest)'; }}
                  >
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: sel ? 'var(--primary-glow)' : 'var(--surface-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sel ? 'var(--bg-app)' : 'var(--text-low)', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nav buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="ghost" size="sm" leftIcon={<ChevronLeft size={14} />} onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
              Previous
            </Button>
            <button
              onClick={() => setFlagged(f => { const n = new Set(f); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: flagged.has(q.id) ? 'var(--warning)' : 'var(--text-low)', cursor: 'pointer', fontSize: '0.8125rem' }}
            >
              <Flag size={14} fill={flagged.has(q.id) ? 'currentColor' : 'none'} />
              {flagged.has(q.id) ? 'Flagged' : 'Flag for Review'}
            </button>
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
          <div className="glass-panel" style={{ width: 440, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
    </div>
  );
};
