import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, FileText, Lock, ChevronRight, BarChart2, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/loaders/Skeleton';
import api from '../lib/api';

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
  const cfg = STATUS_CFG[exam.status];
  const canEnter = exam.status === 'live' || exam.status === 'upcoming';

  return (
    <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <h3 style={{ color: 'var(--text-high)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>{exam.title}</h3>
            <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
            {exam.isProctored && <Badge variant="warning" size="sm"><Lock size={10} /> Proctored</Badge>}
          </div>
          <p style={{ color: 'var(--text-lowest)', fontSize: '0.8125rem', margin: 0 }}>{resolveCourseName(exam.course)}</p>
        </div>
        {exam.status === 'completed' && exam.score !== undefined && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: exam.score >= 60 ? 'var(--success)' : 'var(--error)', fontFamily: 'var(--font-display)' }}>
              {exam.score}<span style={{ fontSize: '0.875rem', color: 'var(--text-low)' }}>/{exam.maxScore}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-lowest)' }}>Score</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-low)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={13} />{exam.durationMinutes} min</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><FileText size={13} />{exam.totalQuestions} questions</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Calendar size={13} />{formatScheduled(exam.scheduledAt)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.25rem', borderTop: '1px solid var(--surface-highest)' }}>
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
  <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <Skeleton variant="text" width="60%" height="20px" />
    <Skeleton variant="text" width="40%" />
    <Skeleton variant="text" width="80%" />
  </div>
);

/* ─────────── Main Page ─────────── */
export const Exams: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | ExamStatus>('all');

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
    { label: 'Live Now', val: exams.filter(e => e.status === 'live').length, color: 'var(--success)' },
    { label: 'Upcoming', val: exams.filter(e => e.status === 'upcoming').length, color: 'var(--primary-glow)' },
    { label: 'Completed', val: exams.filter(e => e.status === 'completed').length, color: 'var(--text-low)' },
    { label: 'Missed', val: exams.filter(e => e.status === 'missed').length, color: 'var(--error)' },
  ];

  const handleEnter = (exam: Exam) => {
    const finalId = exam.id || exam._id;
    // Proctored exams go through pre-flight, others enter directly
    if (exam.isProctored && exam.status === 'live') {
      navigate(`/exams/${finalId}/pre-flight`);
    } else {
      navigate(`/exams/${finalId}`);
    }
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-high)', margin: 0 }}>Exams &amp; Quizzes</h1>
        <p style={{ color: 'var(--text-low)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Monitor your scheduled tests, enter live exams, and review results.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
              <Skeleton variant="text" width="40%" height="32px" className="mb-2" />
              <Skeleton variant="text" width="70%" />
            </div>
          ))
        ) : (
          statsConfig.map(s => (
            <div key={s.label} className="glass-panel" style={{ padding: '1rem 1.25rem', borderTop: `2px solid ${s.color}` }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.val}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))
        )}
      </div>

      {/* Tab filter */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--surface-highest)', paddingBottom: 0 }}>
        {(['all', 'live', 'upcoming', 'completed', 'missed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.625rem 1rem', background: 'none', border: 'none',
              color: activeTab === tab ? 'var(--primary-glow)' : 'var(--text-low)',
              fontWeight: activeTab === tab ? 700 : 400,
              fontSize: '0.875rem', cursor: 'pointer',
              textTransform: 'capitalize',
              borderBottom: activeTab === tab ? '2px solid var(--primary-glow)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tab}
          </button>
        ))}
        {isLoading && <Loader2 size={16} style={{ marginLeft: 'auto', alignSelf: 'center', animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />}
      </div>

      {/* Error State */}
      {isError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', padding: '1rem', background: 'var(--error-container)' }}>
          <AlertCircle size={18} />
          <span>Failed to load exams. Ensure the API server is running.</span>
        </div>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <ExamSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-lowest)' }}>
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
