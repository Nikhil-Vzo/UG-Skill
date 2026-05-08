import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronUp,
  CheckCircle, BookOpen, Users, Rocket, AlertCircle, X, GripVertical
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

const TABS = ['Basic Details', 'Sections & Questions', 'Batch Access & Publish'] as const;
type Tab = typeof TABS[number];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid var(--surface-highest)',
  background: 'var(--surface-well)', color: 'var(--text-high)', fontSize: '0.875rem', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.4rem', color: 'var(--text-low)', fontSize: '0.8125rem', fontWeight: 500 };

/* ─────────────── Empty question template ─────────────── */
const emptyQuestion = (): Question => ({
  stem: '', marks: 1, difficulty: 'easy',
  options: [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
});

/* ─────────────── Component ─────────────── */
export const ExamBuilder: React.FC = () => {
  const { examId } = useParams<{ examId?: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = Boolean(examId);

  const [tab, setTab] = useState<Tab>('Basic Details');
  const [savedExamId, setSavedExamId] = useState<string | null>(examId ?? null);
  const [grantedBatches, setGrantedBatches] = useState<string[]>([]);
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
      // Clean up the payload for API schema validation
      const payload: any = { ...form };
      
      if (!payload.windowStart) delete payload.windowStart;
      else payload.windowStart = new Date(payload.windowStart).toISOString();
      
      if (!payload.windowEnd) delete payload.windowEnd;
      else payload.windowEnd = new Date(payload.windowEnd).toISOString();

      if (savedExamId) {
        const r = await api.patch(`/exams/${savedExamId}`, payload);
        return r.data.data ?? r.data;
      } else {
        const r = await api.post('/exams', payload);
        return r.data.data ?? r.data;
      }
    },
    onSuccess: (exam) => {
      setSavedExamId(exam.id ?? savedExamId);
      qc.invalidateQueries({ queryKey: ['admin-exams'] });
      setTab('Sections & Questions');
    },
  });

  const saveSectionsMutation = useMutation({
    mutationFn: async () => {
      if (!savedExamId) throw new Error('Save exam first');
      
      const allSectionsMongo: { name: string; question_sequence: string[] }[] = [];

      for (const [i, sec] of sections.entries()) {
        // 1. Create/Update PG Section record
        // Note: For a production app, we'd check if section already exists to avoid duplicates,
        // but for this flow we assume a clean save or handle via clear-and-rebuild.
        const sr = await api.post(`/exams/${savedExamId}/sections`, {
          name: sec.name,
          sectionOrder: i + 1,
          timeLimitMinutes: sec.timeLimitMinutes,
          maxMarks: sec.maxMarks,
        });
        
        // 2. Create questions & collect IDs
        const questionIds: string[] = [];
        for (const q of sec.questions) {
          if (!q.stem.trim()) continue;
          
          // If question already has an ID, skip creation (re-use)
          if (q._id) {
            questionIds.push(q._id);
            continue;
          }

          const qr = await api.post('/exams/questions', {
            type: 'mcq',
            stem: q.stem,
            marks: q.marks,
            difficulty: q.difficulty,
            options: q.options,
            status: 'published',
          });
          const qId = qr.data?.data?._id ?? qr.data?._id ?? qr.data?.data?.id ?? qr.data?.id;
          if (qId) questionIds.push(qId);
        }

        allSectionsMongo.push({
          name: sec.name,
          question_sequence: questionIds
        });
      }

      // 3. Update the full exam definition in Mongo once at the end
      if (allSectionsMongo.length > 0) {
        await api.patch(`/exams/${savedExamId}`, {
          mongoDefinition: {
            sections: allSectionsMongo,
          },
        });
      }
    },
    onSuccess: () => setTab('Batch Access & Publish'),
  });

  /* Fetch existing batch access */
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
    mutationFn: async (batchId: string) => {
      await api.post(`/exams/${savedExamId}/batch-access`, { batchId });
    },
    onSuccess: () => refetchAccess(),
  });

  const revokeBatchMutation = useMutation({
    mutationFn: async (batchId: string) => {
      // Assuming DELETE /exams/:id/batch-access/:batchId exists or similar
      await api.delete(`/exams/${savedExamId}/batch-access/${batchId}`);
    },
    onSuccess: () => refetchAccess(),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/exams/${savedExamId}`, { status: 'published' });
    },
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

  const pct = (t: Tab) => {
    if (t === 'Basic Details') return tab === 'Basic Details' ? '●' : '✓';
    if (t === 'Sections & Questions') return (tab === 'Sections & Questions' || tab === 'Batch Access & Publish') ? (savedExamId ? '✓' : '●') : '○';
    return tab === 'Batch Access & Publish' ? '●' : '○';
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/app/admin/exams')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--text-high)', fontFamily: 'var(--font-display)' }}>
            {isEdit ? 'Edit Exam' : 'Create Exam'}
          </h1>
          {savedExamId && <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: 'var(--text-lowest)' }}>ID: {savedExamId}</p>}
        </div>
        {form.status === 'published' && <Badge variant="success">Published</Badge>}
        {form.status === 'draft' && <Badge variant="outline">Draft</Badge>}
      </header>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--surface-highest)', gap: '0' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.75rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t ? 'var(--primary-glow)' : 'var(--text-low)',
            borderBottom: tab === t ? '2px solid var(--primary-glow)' : '2px solid transparent',
            fontWeight: tab === t ? 600 : 400, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <span style={{ fontSize: '0.75rem' }}>{pct(t)}</span> {t}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Basic Details ── */}
      {tab === 'Basic Details' && (
        <Card title="Exam Details">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} placeholder="e.g. Data Structures Mid-Term" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Brief instructions for students..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Duration (minutes) *</label>
              <input style={inputStyle} type="number" min={1} value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={labelStyle}>Total Marks</label>
              <input style={inputStyle} type="number" min={1} value={form.totalMarks} onChange={e => setForm(f => ({ ...f, totalMarks: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={labelStyle}>Pass % (e.g. 40)</label>
              <input style={inputStyle} type="number" min={0} max={100} value={form.passPercent} onChange={e => setForm(f => ({ ...f, passPercent: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={labelStyle}>Window Start (optional)</label>
              <input style={inputStyle} type="datetime-local" value={form.windowStart} onChange={e => setForm(f => ({ ...f, windowStart: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Window End (optional)</label>
              <input style={inputStyle} type="datetime-local" value={form.windowEnd} onChange={e => setForm(f => ({ ...f, windowEnd: e.target.value }))} />
            </div>
          </div>

          {/* Toggles */}
          <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            {([
              { key: 'isProctored', label: 'AI Proctored' },
              { key: 'shuffleQuestions', label: 'Shuffle Questions' },
              { key: 'shuffleOptions', label: 'Shuffle Options' },
            ] as { key: keyof ExamForm; label: string }[]).map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={form[key] as boolean} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                <span style={{ color: 'var(--text-high)', fontSize: '0.875rem' }}>{label}</span>
              </label>
            ))}
          </div>

          {saveExamMutation.isError && (
            <div style={{ marginTop: '1rem', color: 'var(--error)', fontSize: '0.875rem', display: 'flex', gap: '0.5rem' }}>
              <AlertCircle size={16} /> Failed to save exam. Check all required fields.
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" leftIcon={<Save size={16} />} onClick={() => saveExamMutation.mutate()} disabled={!form.title || saveExamMutation.isPending}>
              {saveExamMutation.isPending ? 'Saving…' : savedExamId ? 'Save & Next →' : 'Create Exam & Next →'}
            </Button>
          </div>
        </Card>
      )}

      {/* ── Tab 2: Sections & Questions ── */}
      {tab === 'Sections & Questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!savedExamId && (
            <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--error)', fontSize: '0.875rem', display: 'flex', gap: '0.5rem' }}>
              <AlertCircle size={16} /> Save Basic Details first before adding questions.
            </div>
          )}

          {sections.map((sec, si) => (
            <Card key={si} title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <GripVertical size={16} style={{ color: 'var(--text-lowest)', cursor: 'grab' }} />
                <input
                  value={sec.name}
                  onChange={e => updateSection(si, { name: e.target.value })}
                  style={{ ...inputStyle, width: 'auto', flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.9375rem', fontWeight: 600 }}
                />
              </div>
            } headerAction={
              sections.length > 1 && (
                <button onClick={() => removeSection(si)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '0.25rem' }}>
                  <Trash2 size={16} />
                </button>
              )
            }>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Time Limit (mins, optional)</label>
                  <input style={inputStyle} type="number" min={1} value={sec.timeLimitMinutes ?? ''} onChange={e => updateSection(si, { timeLimitMinutes: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
                <div>
                  <label style={labelStyle}>Max Marks (optional)</label>
                  <input style={inputStyle} type="number" min={0} value={sec.maxMarks ?? ''} onChange={e => updateSection(si, { maxMarks: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
              </div>

              {/* Questions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sec.questions.map((q, qi) => (
                  <div key={qi} style={{ padding: '1rem', border: '1px solid var(--surface-highest)', borderRadius: 8, background: 'var(--surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-low)' }}>Q{qi + 1}</span>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <select value={q.difficulty} onChange={e => updateQuestion(si, qi, { difficulty: e.target.value as any })} style={{ ...inputStyle, width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          {['easy', 'medium', 'hard', 'very_hard'].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <input type="number" min={0.5} step={0.5} value={q.marks} onChange={e => updateQuestion(si, qi, { marks: Number(e.target.value) })} style={{ ...inputStyle, width: 60, padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} title="Marks" />
                        {sec.questions.length > 1 && (
                          <button onClick={() => removeQuestion(si, qi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      style={{ ...inputStyle, minHeight: 60, resize: 'vertical', marginBottom: '0.75rem' }}
                      placeholder="Enter the question stem (what the student sees)..."
                      value={q.stem}
                      onChange={e => updateQuestion(si, qi, { stem: e.target.value })}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {q.options.map((opt, oi) => (
                        <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input type="radio" name={`correct-${si}-${qi}`} checked={opt.isCorrect} onChange={() => setCorrect(si, qi, oi)} style={{ accentColor: 'var(--primary-glow)', flexShrink: 0 }} title="Mark as correct" />
                          <input
                            style={{ ...inputStyle, borderColor: opt.isCorrect ? 'var(--primary-glow)' : 'var(--surface-highest)' }}
                            placeholder={`Option ${oi + 1}${opt.isCorrect ? ' ← correct' : ''}`}
                            value={opt.text}
                            onChange={e => updateQuestion(si, qi, { options: q.options.map((o, i) => i === oi ? { ...o, text: e.target.value } : o) })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => addQuestion(si)} style={{ marginTop: '0.75rem', background: 'none', border: '1px dashed var(--surface-highest)', borderRadius: 6, padding: '0.5rem 1rem', color: 'var(--text-low)', cursor: 'pointer', width: '100%', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <Plus size={14} /> Add Question
              </button>
            </Card>
          ))}

          <button onClick={addSection} style={{ background: 'none', border: '1px dashed var(--primary-glow)', borderRadius: 8, padding: '0.75rem', color: 'var(--primary-glow)', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Add Section
          </button>

          {saveSectionsMutation.isError && (
            <div style={{ color: 'var(--error)', fontSize: '0.875rem', display: 'flex', gap: '0.5rem' }}>
              <AlertCircle size={16} /> Failed to save sections. Ensure exam is saved first.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="ghost" onClick={() => setTab('Basic Details')}>← Back</Button>
            <Button variant="primary" leftIcon={<BookOpen size={16} />} onClick={() => saveSectionsMutation.mutate()} disabled={!savedExamId || saveSectionsMutation.isPending}>
              {saveSectionsMutation.isPending ? 'Saving Questions…' : 'Save Questions & Next →'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Tab 3: Batch Access & Publish ── */}
      {tab === 'Batch Access & Publish' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card title="Grant Batch Access" headerAction={<Users size={18} style={{ color: 'var(--text-low)' }} />}>
            <p style={{ color: 'var(--text-low)', fontSize: '0.875rem', marginTop: 0 }}>
              Select which batches of students can access this exam. Students not in a granted batch will not see it.
            </p>
            {batches.length === 0 ? (
              <p style={{ color: 'var(--text-lowest)', fontSize: '0.875rem' }}>No batches found. Create batches in Batch Management first.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {batches.map(batch => {
                  const access = currentAccess.find((a: any) => a.batchId === batch.id);
                  const granted = !!access;
                  
                  return (
                    <div key={batch.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', border: `1px solid ${granted ? 'var(--primary-glow)' : 'var(--surface-highest)'}`, borderRadius: 8, background: granted ? 'rgba(59,130,246,0.1)' : 'var(--surface-well)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {granted ? <CheckCircle size={18} style={{ color: 'var(--primary-glow)' }} /> : <Users size={18} style={{ color: 'var(--text-lowest)' }} />}
                        <span style={{ fontWeight: 500, color: 'var(--text-high)' }}>{batch.name}</span>
                      </div>
                      {granted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Badge variant="primary">Granted</Badge>
                          <button 
                            onClick={() => revokeBatchMutation.mutate(batch.id)} 
                            disabled={revokeBatchMutation.isPending}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '0.75rem', textDecoration: 'underline' }}
                          >
                            Revoke
                          </button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => grantBatchMutation.mutate(batch.id)} disabled={!savedExamId || grantBatchMutation.isPending}>
                          Grant Access
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="Publish Exam" headerAction={<Rocket size={18} style={{ color: 'var(--text-low)' }} />}>
            {form.status === 'published' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--success)', fontWeight: 500 }}>
                <CheckCircle size={20} /> This exam is live and visible to students in granted batches.
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--text-low)', fontSize: '0.875rem', marginTop: 0 }}>
                  Publishing will make this exam visible to all students in the batches you have granted access to above.
                  Make sure you have added questions and granted at least one batch before publishing.
                </p>
                {publishMutation.isError && (
                  <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>Failed to publish. Please try again.</p>
                )}
                <Button variant="primary" leftIcon={<Rocket size={16} />} onClick={() => publishMutation.mutate()} disabled={!savedExamId || publishMutation.isPending}>
                  {publishMutation.isPending ? 'Publishing…' : 'Publish Exam'}
                </Button>
              </>
            )}
          </Card>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="ghost" onClick={() => setTab('Sections & Questions')}>← Back</Button>
            <Button variant="outline" onClick={() => navigate('/app/admin/exams')}>Done — Go to Exam Ops</Button>
          </div>
        </div>
      )}
    </div>
  );
};
