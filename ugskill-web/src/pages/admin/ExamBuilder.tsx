import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  ArrowLeft, Save, Plus, Trash2,
  CheckCircle, Users, Rocket, AlertCircle, X, GripVertical,
  Clock, Award, CalendarRange, ShieldCheck, Shuffle, Info
} from 'lucide-react';
import api from '../../lib/api';

/* ─────────────── Types ─────────────── */
interface Batch { id: string; name: string; }
interface Question { _id?: string; stem: string; options: { text: string; isCorrect: boolean }[]; marks: number; difficulty: 'easy' | 'medium' | 'hard' | 'very_hard'; }
interface Section { name: string; sectionOrder: number; timeLimitMinutes?: number; maxMarks?: number; questions: Question[]; }
interface ExamForm {
  title: string; description: string; durationMinutes: number; totalMarks: number; passPercent: number;
  isProctored: boolean; shuffleQuestions: boolean; shuffleOptions: boolean;
  windowStart: string; windowEnd: string; status: 'draft' | 'published';
}

/** Extract the exam id from either a POST (returns exam) or PATCH (returns { exam }) response */
const extractExamId = (data: any): string | undefined => {
  if (!data) return undefined;
  return data.id ?? data.exam?.id;
};

const TABS = ['Basic Details', 'Sections & Questions', 'Batch Access & Publish'] as const;
type Tab = typeof TABS[number];

/* ─────────────── Anthropic Brand Palette ─────────────── */
const ANTHRO = {
  bg: '#faf9f5',
  text: '#141413',
  accent: '#d97757',
  accentSecondary: '#6a9bcc',
  accentTertiary: '#788c5d',
  gray: '#e8e6dc',
  mid: '#b0aea5',
  white: '#ffffff',
  error: '#ef4444',
  success: '#10b981',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.875rem 1rem',
  borderRadius: '12px',
  border: `1.5px solid ${ANTHRO.gray}`,
  background: ANTHRO.white,
  color: ANTHRO.text,
  fontSize: '0.9375rem',
  fontFamily: 'Lora, Georgia, serif',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  color: ANTHRO.text,
  fontSize: '0.875rem',
  fontWeight: 600,
  fontFamily: 'Poppins, Arial, sans-serif',
  opacity: 0.9,
};

const stepContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '3rem',
  position: 'relative',
  padding: '0 1rem',
};

const stepLineStyle: React.CSSProperties = {
  position: 'absolute',
  top: '20px',
  left: '10%',
  right: '10%',
  height: '2px',
  background: ANTHRO.gray,
  zIndex: 0,
};

/* ─────────────── Empty question template ─────────────── */
const emptyQuestion = (): Question => ({
  stem: '',
  marks: 1,
  difficulty: 'easy',
  options: [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
});

/* ─────────────── Sub-components ─────────────── */
const PremiumCard: React.FC<{ title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; headerAction?: React.ReactNode }> = ({ title, children, footer, headerAction }) => (
  <div style={{
    background: ANTHRO.white,
    borderRadius: '24px',
    border: `1px solid ${ANTHRO.gray}`,
    boxShadow: '0 4px 20px rgba(20, 20, 19, 0.03)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease',
  }}>
    <div style={{ padding: '1.5rem 2rem', borderBottom: `1px solid ${ANTHRO.gray}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ margin: 0, fontSize: '1.125rem', color: ANTHRO.text, fontFamily: 'Poppins, Arial, sans-serif', fontWeight: 600 }}>{title}</h2>
      {headerAction}
    </div>
    <div style={{ padding: '2rem' }}>{children}</div>
    {footer && <div style={{ padding: '1.25rem 2rem', background: ANTHRO.bg, borderTop: `1px solid ${ANTHRO.gray}`, display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>{footer}</div>}
  </div>
);

const Step: React.FC<{ active: boolean; completed: boolean; label: string; number: number; onClick: () => void }> = ({ active, completed, label, number, onClick }) => (
  <div onClick={onClick} style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    gap: '0.75rem', 
    cursor: 'pointer', 
    zIndex: 1,
    transition: 'all 0.3s ease',
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: active ? ANTHRO.accent : (completed ? ANTHRO.text : ANTHRO.white),
      color: active || completed ? ANTHRO.white : ANTHRO.mid,
      border: `2px solid ${active ? ANTHRO.accent : (completed ? ANTHRO.text : ANTHRO.gray)}`,
      fontWeight: 600,
      fontSize: '0.875rem',
      boxShadow: active ? `0 0 15px ${ANTHRO.accent}40` : 'none',
    }}>
      {completed ? <CheckCircle size={20} /> : number}
    </div>
    <span style={{
      fontSize: '0.75rem',
      fontWeight: 600,
      color: active ? ANTHRO.accent : (completed ? ANTHRO.text : ANTHRO.mid),
      fontFamily: 'Poppins, Arial, sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      {label}
    </span>
  </div>
);

/* ─────────────── Main Component ─────────────── */
export const ExamBuilder: React.FC = () => {
  const { examId } = useParams<{ examId?: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = Boolean(examId);

  const [tab, setTab] = useState<Tab>('Basic Details');
  const [savedExamId, setSavedExamId] = useState<string | null>(examId ?? null);
  const [sections, setSections] = useState<Section[]>([
    { name: 'Section 1', sectionOrder: 1, questions: [emptyQuestion()] },
  ]);
  const [form, setForm] = useState<ExamForm>({
    title: '', description: '', durationMinutes: 60, totalMarks: 100, passPercent: 40,
    isProctored: true, shuffleQuestions: false, shuffleOptions: false,
    windowStart: '', windowEnd: '', status: 'draft',
  });

  /* Fetch existing exam if editing */
  const { data: existingExam } = useQuery({
    queryKey: ['exam-builder', examId],
    queryFn: async () => { const r = await api.get(`/exams/${examId}`); return r.data.data ?? r.data; },
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existingExam) return;
    const e = existingExam;
    setForm({
      title: e.title ?? '', description: e.description ?? '',
      durationMinutes: e.durationMinutes ?? 60, totalMarks: e.totalMarks ?? 100,
      passPercent: e.passPercent ?? 40, isProctored: e.isProctored ?? true,
      shuffleQuestions: e.shuffleQuestions ?? false, shuffleOptions: e.shuffleOptions ?? false,
      windowStart: e.windowStart ? e.windowStart.slice(0, 16) : '',
      windowEnd: e.windowEnd ? e.windowEnd.slice(0, 16) : '',
      status: e.status ?? 'draft',
    });
  }, [existingExam]);

  /* Fetch batches for access tab */
  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['admin-batches-list'],
    queryFn: async () => { const r = await api.get('/admin/batches'); return r.data.data ?? []; },
  });

  /* ── Mutations ── */
  const saveExamMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form };
      // Clean up empty optional fields so validation passes cleanly
      if (!payload.description) delete payload.description;
      if (!payload.windowStart) delete payload.windowStart;
      else payload.windowStart = new Date(payload.windowStart).toISOString();
      if (!payload.windowEnd) delete payload.windowEnd;
      else payload.windowEnd = new Date(payload.windowEnd).toISOString();

      if (savedExamId) {
        const r = await api.patch(`/exams/${savedExamId}`, payload);
        // PATCH returns { data: { exam: {...} } } — normalize to flat exam object
        const raw = r.data.data ?? r.data;
        return raw.exam ?? raw;
      } else {
        const r = await api.post('/exams', payload);
        return r.data.data ?? r.data;
      }
    },
    onSuccess: (exam) => {
      const id = extractExamId(exam) ?? savedExamId;
      if (id) setSavedExamId(id);
      qc.invalidateQueries({ queryKey: ['admin-exams'] });
      setTab('Sections & Questions');
    },
  });

  const saveSectionsMutation = useMutation({
    mutationFn: async () => {
      if (!savedExamId) throw new Error('Save exam first');
      const allSectionsMongo: { name: string; question_sequence: string[] }[] = [];
      for (const [i, sec] of sections.entries()) {
        const sr = await api.post(`/exams/${savedExamId}/sections`, {
          name: sec.name,
          sectionOrder: i + 1,
          timeLimitMinutes: sec.timeLimitMinutes,
          maxMarks: sec.maxMarks,
        });
        const questionIds: string[] = [];
        for (const q of sec.questions) {
          if (!q.stem.trim()) continue;
          if (q._id) { questionIds.push(q._id); continue; }
          const qr = await api.post('/exams/questions', {
            type: 'mcq', stem: q.stem, marks: q.marks, difficulty: q.difficulty, options: q.options, status: 'published',
          });
          const qId = qr.data?.data?._id ?? qr.data?._id ?? qr.data?.data?.id ?? qr.data?.id;
          if (qId) questionIds.push(qId);
        }
        allSectionsMongo.push({ name: sec.name, question_sequence: questionIds });
      }
      if (allSectionsMongo.length > 0) {
        await api.patch(`/exams/${savedExamId}`, { mongoDefinition: { sections: allSectionsMongo } });
      }
    },
    onSuccess: () => setTab('Batch Access & Publish'),
  });

  const { data: currentAccess = [], refetch: refetchAccess } = useQuery({
    queryKey: ['exam-batch-access', savedExamId],
    queryFn: async () => {
      if (!savedExamId) return [];
      const r = await api.get(`/exams/${savedExamId}/batch-access`);
      return r.data.data ?? [];
    },
    enabled: Boolean(savedExamId) && tab === 'Batch Access & Publish',
  });

  const grantBatchMutation = useMutation({
    mutationFn: async (batchId: string) => { await api.post(`/exams/${savedExamId}/batch-access`, { batchId }); },
    onSuccess: () => refetchAccess(),
  });

  const revokeBatchMutation = useMutation({
    mutationFn: async (batchId: string) => { await api.delete(`/exams/${savedExamId}/batch-access/${batchId}`); },
    onSuccess: () => refetchAccess(),
  });

  const publishMutation = useMutation({
    mutationFn: async () => { await api.patch(`/exams/${savedExamId}`, { status: 'published' }); },
    onSuccess: () => {
      setForm(f => ({ ...f, status: 'published' }));
      qc.invalidateQueries({ queryKey: ['admin-exams'] });
    },
  });

  /* ── Section helpers ── */
  const addSection = () => setSections(s => [...s, { name: `Section ${s.length + 1}`, sectionOrder: s.length + 1, questions: [emptyQuestion()] }]);
  const removeSection = (i: number) => setSections(s => s.filter((_, idx) => idx !== i));
  const updateSection = (i: number, patch: Partial<Section>) => setSections(s => s.map((sec, idx) => idx === i ? { ...sec, ...patch } : sec));
  const addQuestion = (si: number) => setSections(s => s.map((sec, idx) => idx === si ? { ...sec, questions: [...sec.questions, emptyQuestion()] } : sec));
  const removeQuestion = (si: number, qi: number) => setSections(s => s.map((sec, idx) => idx === si ? { ...sec, questions: sec.questions.filter((_, i) => i !== qi) } : sec));
  const updateQuestion = (si: number, qi: number, patch: Partial<Question>) => setSections(s => s.map((sec, idx) => idx === si ? { ...sec, questions: sec.questions.map((q, i) => i === qi ? { ...q, ...patch } : q) } : sec));
  const setCorrect = (si: number, qi: number, oi: number) => {
    setSections(s => s.map((sec, sIdx) => sIdx !== si ? sec : {
      ...sec, questions: sec.questions.map((q, qIdx) => qIdx !== qi ? q : {
        ...q, options: q.options.map((o, oIdx) => ({ ...o, isCorrect: oIdx === oi })),
      }),
    }));
  };

  return (
    <div style={{ minHeight: '100vh', background: ANTHRO.bg, padding: '3rem 1rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button 
              onClick={() => navigate('/app/admin/exams')} 
              style={{ 
                background: 'none', border: 'none', cursor: 'pointer', color: ANTHRO.mid, 
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem',
                marginBottom: '1rem', padding: 0,
                fontFamily: 'Poppins, Arial, sans-serif', fontWeight: 500
              }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <h1 style={{ margin: 0, fontSize: '2.5rem', color: ANTHRO.text, fontFamily: 'Poppins, Arial, sans-serif', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {isEdit ? 'Edit Assessment' : 'New Assessment'}
            </h1>
            <p style={{ margin: '0.5rem 0 0', color: ANTHRO.mid, fontFamily: 'Lora, Georgia, serif', fontSize: '1.125rem' }}>
              Design a high-quality evaluation experience for your students.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             {form.status === 'published' ? <Badge variant="success">Live</Badge> : <Badge variant="outline">Draft Mode</Badge>}
          </div>
        </header>

        {/* Custom Progress Indicator */}
        <div style={stepContainerStyle}>
          <div style={stepLineStyle} />
          <Step 
            number={1} 
            label="Structure" 
            active={tab === 'Basic Details'} 
            completed={tab !== 'Basic Details'} 
            onClick={() => setTab('Basic Details')} 
          />
          <Step 
            number={2} 
            label="Curriculum" 
            active={tab === 'Sections & Questions'} 
            completed={tab === 'Batch Access & Publish'} 
            onClick={() => savedExamId && setTab('Sections & Questions')} 
          />
          <Step 
            number={3} 
            label="Deployment" 
            active={tab === 'Batch Access & Publish'} 
            completed={false} 
            onClick={() => savedExamId && setTab('Batch Access & Publish')} 
          />
        </div>

        {/* ── Tab 1: Basic Details ── */}
        {tab === 'Basic Details' && (
          <PremiumCard
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>Assessment Configuration</span>
                {savedExamId && <Badge variant="success">Saved ✓</Badge>}
              </span>
            }
            footer={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                {saveExamMutation.isError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: ANTHRO.error, fontSize: '0.875rem', padding: '0.75rem 1rem', background: `${ANTHRO.error}10`, borderRadius: '10px' }}>
                    <AlertCircle size={16} />
                    <span>Failed to save. Check all required fields and try again.</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="primary"
                    leftIcon={<Save size={18} />}
                    onClick={() => saveExamMutation.mutate()}
                    disabled={!form.title.trim() || form.durationMinutes < 1 || saveExamMutation.isPending}
                    style={{ background: ANTHRO.text, color: ANTHRO.white, borderRadius: '12px', padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600 }}
                  >
                    {saveExamMutation.isPending ? 'Saving…' : savedExamId ? 'Update & Continue →' : 'Save & Continue →'}
                  </Button>
                </div>
              </div>
            }
          >
            {/* Required fields notice */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.75rem 1rem', background: `${ANTHRO.accentSecondary}10`, borderRadius: '10px', fontSize: '0.8125rem', color: ANTHRO.accentSecondary }}>
              <Info size={14} />
              <span>Fields marked <strong>*</strong> are required. All others are optional.</span>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Exam Title <span style={{ color: ANTHRO.error }}>*</span></label>
              <input
                style={{
                  ...inputStyle,
                  fontSize: '1.125rem', fontWeight: 600,
                  borderColor: !form.title.trim() ? ANTHRO.error : ANTHRO.gray,
                }}
                placeholder="e.g. GATE CS 2025 Mock Test — Full Syllabus"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              {!form.title.trim() && (
                <p style={{ color: ANTHRO.error, fontSize: '0.8rem', marginTop: '0.375rem' }}>Title is required (min 3 characters)</p>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Instructions / Description <span style={{ color: ANTHRO.mid, fontWeight: 400 }}>(optional)</span></label>
              <textarea
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                placeholder="Describe the exam scope, rules, and any special instructions for candidates…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Numeric fields row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={labelStyle}>
                  <Clock size={14} style={{ display: 'inline', marginRight: '0.375rem', verticalAlign: 'middle' }} />
                  Duration (mins) <span style={{ color: ANTHRO.error }}>*</span>
                </label>
                <input
                  style={{ ...inputStyle, borderColor: form.durationMinutes < 1 ? ANTHRO.error : ANTHRO.gray }}
                  type="number" min={1} max={600}
                  value={form.durationMinutes}
                  onChange={e => setForm(f => ({ ...f, durationMinutes: Math.max(1, Number(e.target.value)) }))}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  <Award size={14} style={{ display: 'inline', marginRight: '0.375rem', verticalAlign: 'middle' }} />
                  Total Marks
                </label>
                <input
                  style={inputStyle}
                  type="number" min={1}
                  value={form.totalMarks}
                  onChange={e => setForm(f => ({ ...f, totalMarks: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label style={labelStyle}>Pass % Cutoff</label>
                <input
                  style={inputStyle}
                  type="number" min={0} max={100}
                  value={form.passPercent}
                  onChange={e => setForm(f => ({ ...f, passPercent: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Window dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label style={labelStyle}>
                  <CalendarRange size={14} style={{ display: 'inline', marginRight: '0.375rem', verticalAlign: 'middle' }} />
                  Available From <span style={{ color: ANTHRO.mid, fontWeight: 400 }}>(optional)</span>
                </label>
                <input style={inputStyle} type="datetime-local" value={form.windowStart} onChange={e => setForm(f => ({ ...f, windowStart: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>
                  <CalendarRange size={14} style={{ display: 'inline', marginRight: '0.375rem', verticalAlign: 'middle' }} />
                  Available Until <span style={{ color: ANTHRO.mid, fontWeight: 400 }}>(optional)</span>
                </label>
                <input style={inputStyle} type="datetime-local" value={form.windowEnd} onChange={e => setForm(f => ({ ...f, windowEnd: e.target.value }))} />
              </div>
            </div>

            {/* Toggle options */}
            <div>
              <label style={{ ...labelStyle, marginBottom: '1rem', display: 'block' }}>Exam Settings</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {[
                  { key: 'isProctored', label: 'AI Proctoring', desc: 'Monitor via webcam', icon: <ShieldCheck size={18} />, color: ANTHRO.accentSecondary },
                  { key: 'shuffleQuestions', label: 'Shuffle Questions', desc: 'Randomize question order', icon: <Shuffle size={18} />, color: ANTHRO.accentTertiary },
                  { key: 'shuffleOptions', label: 'Shuffle Options', desc: 'Randomize answer choices', icon: <Shuffle size={18} />, color: ANTHRO.accent },
                ].map(({ key, label, desc, icon, color }) => (
                  <label
                    key={key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem',
                      border: `2px solid ${form[key as keyof ExamForm] ? color : ANTHRO.gray}`,
                      borderRadius: '14px', cursor: 'pointer',
                      background: form[key as keyof ExamForm] ? `${color}0d` : ANTHRO.white,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ color: form[key as keyof ExamForm] ? color : ANTHRO.mid }}>{icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: form[key as keyof ExamForm] ? color : ANTHRO.text }}>{label}</div>
                      <div style={{ fontSize: '0.75rem', color: ANTHRO.mid }}>{desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form[key as keyof ExamForm] as boolean}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      style={{ width: '18px', height: '18px', accentColor: color, cursor: 'pointer' }}
                    />
                  </label>
                ))}
              </div>
            </div>
          </PremiumCard>
        )}

        {/* ── Tab 2: Sections & Questions ── */}
        {tab === 'Sections & Questions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {sections.map((sec, si) => (
              <PremiumCard 
                key={si} 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ background: ANTHRO.bg, padding: '0.5rem', borderRadius: '8px' }}><GripVertical size={16} style={{ color: ANTHRO.mid }} /></div>
                    <input
                      value={sec.name}
                      onChange={e => updateSection(si, { name: e.target.value })}
                      style={{ 
                        background: 'transparent', border: 'none', flex: 1, 
                        fontSize: '1.25rem', fontWeight: 700, color: ANTHRO.text,
                        fontFamily: 'Poppins, Arial, sans-serif', outline: 'none'
                      }}
                      placeholder="Section Title..."
                    />
                  </div>
                } 
                headerAction={
                  sections.length > 1 && (
                    <button onClick={() => removeSection(si)} style={{ background: `${ANTHRO.error}10`, border: 'none', borderRadius: '8px', cursor: 'pointer', color: ANTHRO.error, padding: '0.5rem' }}>
                      <Trash2 size={18} />
                    </button>
                  )
                }
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem', padding: '1rem', background: ANTHRO.bg, borderRadius: '16px' }}>
                  <div>
                    <label style={labelStyle}>Section Duration (Optional)</label>
                    <input style={inputStyle} type="number" placeholder="Mins" value={sec.timeLimitMinutes ?? ''} onChange={e => updateSection(si, { timeLimitMinutes: e.target.value ? Number(e.target.value) : undefined })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Section Marks (Optional)</label>
                    <input style={inputStyle} type="number" placeholder="Total" value={sec.maxMarks ?? ''} onChange={e => updateSection(si, { maxMarks: e.target.value ? Number(e.target.value) : undefined })} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {sec.questions.map((q, qi) => (
                    <div key={qi} style={{ 
                      padding: '2rem', border: `1.5px solid ${ANTHRO.gray}`, borderRadius: '20px', background: ANTHRO.white,
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: ANTHRO.mid, textTransform: 'uppercase' }}>Q{qi + 1}</span>
                          <div style={{ height: '4px', width: '20px', background: ANTHRO.gray, borderRadius: '2px' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <select 
                            value={q.difficulty} 
                            onChange={e => updateQuestion(si, qi, { difficulty: e.target.value as any })} 
                            style={{ ...inputStyle, width: 'auto', padding: '0.4rem 1rem', fontSize: '0.8125rem', borderRadius: '10px' }}
                          >
                            {['easy', 'medium', 'hard', 'very_hard'].map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
                          </select>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: ANTHRO.bg, padding: '0.4rem 0.8rem', borderRadius: '10px', border: `1px solid ${ANTHRO.gray}` }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{q.marks} pts</span>
                            <input 
                              type="range" min={1} max={10} step={1} value={q.marks} 
                              onChange={e => updateQuestion(si, qi, { marks: Number(e.target.value) })}
                              style={{ width: '60px', accentColor: ANTHRO.text }}
                            />
                          </div>
                          {sec.questions.length > 1 && (
                            <button onClick={() => removeQuestion(si, qi)} style={{ color: ANTHRO.mid, border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
                          )}
                        </div>
                      </div>
                      <textarea
                        style={{ ...inputStyle, minHeight: 80, fontSize: '1.125rem', marginBottom: '1.5rem', borderStyle: 'dashed' }}
                        placeholder="Type your question prompt here..."
                        value={q.stem}
                        onChange={e => updateQuestion(si, qi, { stem: e.target.value })}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {q.options.map((opt, oi) => (
                          <div key={oi} style={{ position: 'relative' }}>
                            <input
                              style={{ 
                                ...inputStyle, 
                                paddingLeft: '3rem',
                                borderColor: opt.isCorrect ? ANTHRO.success : ANTHRO.gray,
                                background: opt.isCorrect ? `${ANTHRO.success}05` : ANTHRO.white
                              }}
                              placeholder={`Distractor ${oi + 1}`}
                              value={opt.text}
                              onChange={e => updateQuestion(si, qi, { options: q.options.map((o, i) => i === oi ? { ...o, text: e.target.value } : o) })}
                            />
                            <div 
                              onClick={() => setCorrect(si, qi, oi)}
                              style={{
                                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                                width: '24px', height: '24px', borderRadius: '50%',
                                border: `2px solid ${opt.isCorrect ? ANTHRO.success : ANTHRO.gray}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', background: opt.isCorrect ? ANTHRO.success : 'transparent',
                                color: ANTHRO.white, transition: 'all 0.2s ease'
                              }}
                            >
                              {opt.isCorrect && <CheckCircle size={14} />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => addQuestion(si)} 
                  style={{ 
                    marginTop: '2rem', background: 'transparent', border: `2px dashed ${ANTHRO.gray}`, borderRadius: '16px', 
                    padding: '1.25rem', color: ANTHRO.mid, cursor: 'pointer', width: '100%', 
                    fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Plus size={20} /> Add Next Question
                </button>
              </PremiumCard>
            ))}

            <button 
              onClick={addSection} 
              style={{ 
                background: ANTHRO.white, border: `2px solid ${ANTHRO.accentSecondary}`, borderRadius: '20px', 
                padding: '1.5rem', color: ANTHRO.accentSecondary, cursor: 'pointer', 
                fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' 
              }}
            >
              <Plus size={24} /> Add New Evaluation Section
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <Button variant="ghost" onClick={() => setTab('Basic Details')} style={{ color: ANTHRO.mid }}>Back to Structure</Button>
              <Button 
                variant="primary" 
                leftIcon={<Rocket size={20} />} 
                onClick={() => saveSectionsMutation.mutate()} 
                disabled={!savedExamId || saveSectionsMutation.isPending}
                style={{ background: ANTHRO.text, color: ANTHRO.white, borderRadius: '12px', padding: '1rem 2rem' }}
              >
                {saveSectionsMutation.isPending ? 'Syncing Questions…' : 'Finalize Content & Deploy'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Tab 3: Batch Access & Publish ── */}
        {tab === 'Batch Access & Publish' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <PremiumCard title="Target Audience (Batches)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {batches.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: ANTHRO.mid }}>
                    <Users size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p>No candidate batches identified.</p>
                  </div>
                ) : (
                  batches.map(batch => {
                    const granted = currentAccess.some((a: any) => a.batchId === batch.id);
                    return (
                      <div key={batch.id} style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', 
                        border: `2px solid ${granted ? ANTHRO.accentSecondary : ANTHRO.gray}`, 
                        borderRadius: '20px', background: granted ? `${ANTHRO.accentSecondary}05` : ANTHRO.white,
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '12px', 
                            background: granted ? ANTHRO.accentSecondary : ANTHRO.gray, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: ANTHRO.white 
                          }}>
                            <Users size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: ANTHRO.text, fontSize: '1rem' }}>{batch.name}</div>
                            <div style={{ fontSize: '0.8125rem', color: ANTHRO.mid }}>{granted ? 'Access Granted' : 'No Access'}</div>
                          </div>
                        </div>
                        <Button 
                          variant={granted ? 'ghost' : 'outline'} 
                          size="sm" 
                          onClick={() => granted ? revokeBatchMutation.mutate(batch.id) : grantBatchMutation.mutate(batch.id)} 
                          style={{ borderRadius: '10px', color: granted ? ANTHRO.error : ANTHRO.accentSecondary, borderColor: granted ? 'transparent' : ANTHRO.accentSecondary }}
                        >
                          {granted ? 'Revoke' : 'Grant Access'}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </PremiumCard>

            <PremiumCard title="Release Assessment">
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                {form.status === 'published' ? (
                  <div style={{ color: ANTHRO.success, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${ANTHRO.success}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={40} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Assessment is Live</h3>
                    <p style={{ color: ANTHRO.mid, maxWidth: '400px' }}>Candidates in the selected batches can now view and attempt this evaluation based on the schedule.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${ANTHRO.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ANTHRO.accent }}>
                      <Rocket size={40} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>Ready for Deployment?</h3>
                      <p style={{ color: ANTHRO.mid, maxWidth: '450px' }}>This will officially release the assessment to the selected student batches. Ensure all content and time limits are final.</p>
                    </div>
                    <Button 
                      variant="primary" 
                      leftIcon={<Rocket size={20} />} 
                      onClick={() => publishMutation.mutate()} 
                      disabled={!savedExamId || publishMutation.isPending}
                      style={{ background: ANTHRO.accent, color: ANTHRO.white, borderRadius: '16px', padding: '1.25rem 3rem', fontSize: '1.125rem', fontWeight: 700 }}
                    >
                      {publishMutation.isPending ? 'Deploying…' : 'Confirm & Publish Live'}
                    </Button>
                  </div>
                )}
              </div>
            </PremiumCard>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="ghost" onClick={() => setTab('Sections & Questions')} style={{ color: ANTHRO.mid }}>Back to Content</Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/app/admin/exams')}
                style={{ borderRadius: '12px', border: `2px solid ${ANTHRO.text}`, color: ANTHRO.text, fontWeight: 600 }}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
