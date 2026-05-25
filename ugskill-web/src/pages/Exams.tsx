import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { Clock, FileText, Lock, ChevronRight, BarChart2, Calendar, Loader2, AlertCircle, ClipboardList } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/loaders/Skeleton';
import api from '../lib/api';
import './Exams.css';

/* ─────────── Types ─────────── */
type ExamStatus = 'upcoming' | 'live' | 'completed' | 'missed';

interface Exam {
  id: string;
  _id?: string; // fallback
  title: string;
  course?: string | { title: string };
  durationMinutes: number;
  totalQuestions: number;
  scheduledAt: string;
  status: ExamStatus;
  score?: number;
  maxScore: number;
  isProctored: boolean;
}

/* ─────────── Config ─────────── */
const STATUS_CFG: Record<ExamStatus, { label: string; variant: any; color: string }> = {
  live: { label: '● Live Now', variant: 'success', color: 'var(--success)' },
  upcoming: { label: 'Upcoming', variant: 'primary', color: 'var(--primary-glow)' },
  completed: { label: 'Completed', variant: 'secondary', color: 'var(--text-low)' },
  missed: { label: 'Missed', variant: 'danger', color: 'var(--error)' },
};

/* ─────────── Helpers ─────────── */
function resolveCourseName(c: Exam['course']): string {
  if (!c) return '';
  if (typeof c === 'string') return c;
  return c.title ?? '';
}

function formatScheduled(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleString('en-IN', {
      dateStyle: 'medium', timeStyle: 'short'
    });
  } catch {
    return isoStr;
  }
}

/* ─────────── ExamCard ─────────── */
const ExamCard: React.FC<{ exam: Exam; onEnter: () => void }> = ({ exam, onEnter }) => {
  const cfg = STATUS_CFG[exam.status as ExamStatus] || { label: exam.status || 'Unknown', variant: 'secondary', color: 'var(--text-low)' };
  const canEnter = exam.status === 'live' || exam.status === 'upcoming';

  return (
    <div className={`exam-card-premium ${exam.status === 'live' ? 'exam-card-premium--live' : ''}`}>
      <div className="exam-card-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <h3 className="exam-card-title">{exam.title}</h3>
            <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
            {exam.isProctored && <Badge variant="warning" size="sm"><Lock size={10} /> Proctored</Badge>}
          </div>
          <p className="exam-card-course">{resolveCourseName(exam.course)}</p>
        </div>
        {exam.status === 'completed' && exam.score !== undefined && (
          <div className="exam-card-score">
            <div className="exam-card-score-value" style={{ color: exam.score >= 60 ? 'var(--duo-green)' : 'var(--duo-red)' }}>
              {exam.score}<span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>/{exam.maxScore}</span>
            </div>
            <div className="exam-card-score-label">Score</div>
          </div>
        )}
      </div>

      <div className="exam-card-meta">
        <span><Clock size={13} />{exam.durationMinutes} min</span>
        <span><FileText size={13} />{exam.totalQuestions} questions</span>
        <span><Calendar size={13} />{formatScheduled(exam.scheduledAt)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.25rem', borderTop: '1px solid var(--duo-border)' }}>
        {exam.status === 'completed' && (
          <Button variant="ghost" size="sm" leftIcon={<BarChart2 size={14} />}>View Report</Button>
        )}
        {canEnter && (
          <Button
            variant={exam.status === 'live' ? 'primary' : 'outline'}
            size="sm"
            rightIcon={<ChevronRight size={14} />}
            onClick={onEnter}
          >
            {exam.status === 'live' ? 'Enter Exam' : 'Preview'}
          </Button>
        )}
      </div>
    </div>
  );
};

/* ─────────── Exam Skeleton ─────────── */
const ExamSkeleton: React.FC = () => (
  <div className="exam-skeleton-card">
    <Skeleton variant="text" width="60%" height="20px" />
    <Skeleton variant="text" width="40%" />
    <Skeleton variant="text" width="80%" />
  </div>
);

/* ─────────── Main Page ─────────── */
export const Exams: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'all' | ExamStatus>('all');
  const isAdmin = user?.roles?.some(r => ['admin', 'super_admin', 'creator'].includes(r));

  const { data: exams = [], isLoading, isError } = useQuery<Exam[]>({
    queryKey: ['exams', 'mine'],
    queryFn: async () => {
      const res = await api.get('/exams');
      return res.data.data?.exams ?? res.data.data ?? res.data ?? [];
    },
    staleTime: 30_000,
  });

  const filtered = activeTab === 'all' ? exams : exams.filter(e => e.status === activeTab);

  const statsConfig = [
    { label: 'Live Now', val: exams.filter(e => e.status === 'live').length, color: 'var(--duo-green)' },
    { label: 'Upcoming', val: exams.filter(e => e.status === 'upcoming').length, color: 'var(--duo-blue)' },
    { label: 'Completed', val: exams.filter(e => e.status === 'completed').length, color: 'var(--text-secondary)' },
    { label: 'Missed', val: exams.filter(e => e.status === 'missed').length, color: 'var(--duo-red)' },
  ];

  const handleEnter = (exam: Exam) => {
    const finalId = exam.id || exam._id;
    // Admins can always enter/preview
    if (exam.isProctored && (exam.status === 'live' || isAdmin)) {
      navigate(`/app/exams/${finalId}/pre-flight?admin=${isAdmin}`);
    } else {
      navigate(`/app/exams/${finalId}`);
    }
  };

  return (
    <div className="exams-page">
      <header className="exams-hero ugs-hero">
        <div className="exams-hero-content">
          <div className="exams-hero-badge"><ClipboardList size={14} /> Assessments</div>
          <h1 className="ugs-hero-title">Exams &amp; Quizzes</h1>
          <p className="ugs-hero-subtitle">Monitor scheduled tests, enter live exams, and review your results.</p>
        </div>
      </header>

      <div className="exams-stats">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="exams-stat-card">
              <Skeleton variant="text" width="40%" height="32px" className="mb-2" />
              <Skeleton variant="text" width="70%" />
            </div>
          ))
        ) : (
          statsConfig.map(s => (
            <div key={s.label} className="exams-stat-card" style={{ borderBottomColor: s.color }}>
              <div className="exams-stat-value" style={{ color: s.color }}>{s.val}</div>
              <div className="exams-stat-label">{s.label}</div>
            </div>
          ))
        )}
      </div>

      <div className="exams-tabs">
        {(['all', 'live', 'upcoming', 'completed', 'missed'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`exams-tab ${activeTab === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
        {isLoading && <Loader2 size={16} className="exams-tab-loader" />}
      </div>

      {isError && (
        <div className="exams-error">
          <AlertCircle size={18} />
          <span>Failed to load exams. Ensure the API server is running.</span>
        </div>
      )}

      <div className="exams-list">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <ExamSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="exams-empty">
            No exams in this category.
          </div>
        ) : (
          filtered.map(e => (
            <ExamCard key={e.id || e._id} exam={e} onEnter={() => handleEnter(e)} />
          ))
        )}
      </div>
    </div>
  );
};
