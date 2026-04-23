import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Trash2, CheckCircle2, AlertCircle, Loader, Save } from 'lucide-react';
import api from '../../lib/api';

/* ---------- types ---------- */
interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  explanation?: string;
  options: Option[];
}

interface QuizDefinition {
  id: string;
  title: string;
  questions: Question[];
}

/* ---------- fetchers ---------- */
const fetchQuiz = async (quizId: string): Promise<QuizDefinition> => {
  const { data } = await api.get(`/lms/quizzes/${quizId}`);
  return data.data;
};

const saveQuiz = async (payload: { quizId?: string; title: string; questions: Question[] }) => {
  if (payload.quizId) {
    const { data } = await api.put(`/lms/quizzes/${payload.quizId}`, payload);
    return data;
  }
  const { data } = await api.post('/lms/quizzes', payload);
  return data;
};

/* ---------- helpers ---------- */
const makeOption = (): Option => ({ id: `opt_${Date.now()}`, text: '', isCorrect: false });
const makeQuestion = (): Question => ({
  id: `q_${Date.now()}`,
  text: '',
  explanation: '',
  options: [makeOption(), makeOption()],
});

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text-primary)',
  boxSizing: 'border-box' as const,
  fontSize: '0.9rem',
};

/* ---------- component ---------- */
export const QuizBuilder: React.FC = () => {
  const { quizId } = useParams<{ quizId?: string }>();
  const navigate = useNavigate();
  const isNew = !quizId;

  const { data: remote, isPending: loading, isError } = useQuery<QuizDefinition>({
    queryKey: ['quiz-builder', quizId],
    queryFn: () => fetchQuiz(quizId!),
    enabled: !!quizId,
  });

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([makeQuestion()]);
  const [saved, setSaved] = useState(false);

  // Sync remote into local state once loaded
  React.useEffect(() => {
    if (remote) {
      setTitle(remote.title);
      setQuestions(remote.questions);
    }
  }, [remote]);

  const saveMutation = useMutation({
    mutationFn: () => saveQuiz({ quizId, title, questions }),
    onSuccess: (result) => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (isNew && result?.data?.id) {
        navigate(`/admin/quizzes/${result.data.id}/builder`, { replace: true });
      }
    },
  });

  /* ---- question helpers ---- */
  const updateQ = (qId: string, patch: Partial<Question>) =>
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, ...patch } : q)));

  const deleteQ = (qId: string) => setQuestions((prev) => prev.filter((q) => q.id !== qId));

  const setCorrect = (qId: string, oId: string) =>
    updateQ(qId, {
      options: questions.find((q) => q.id === qId)!.options.map((o) => ({
        ...o,
        isCorrect: o.id === oId,
      })),
    });

  const updateOption = (qId: string, oId: string, text: string) =>
    updateQ(qId, {
      options: questions.find((q) => q.id === qId)!.options.map((o) =>
        o.id === oId ? { ...o, text } : o
      ),
    });

  const deleteOption = (qId: string, oId: string) =>
    updateQ(qId, {
      options: questions.find((q) => q.id === qId)!.options.filter((o) => o.id !== oId),
    });

  if (!isNew && loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--text-secondary)' }}>
        <Loader size={24} style={{ animation: 'spin 0.8s linear infinite' }} />
        Loading quiz…
      </div>
    );
  }

  if (!isNew && isError) {
    return (
      <div style={{ padding: '2rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--error)' }}>
            <AlertCircle size={20} />
            <span>Failed to load quiz.</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '2rem' }}>
            {isNew ? 'New Quiz' : title || 'Quiz Builder'}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !title.trim()}
          style={{ background: saved ? 'var(--success)' : undefined }}
        >
          {saveMutation.isPending ? 'Saving…' : saved ? 'Saved!' : 'Save Quiz'}
        </Button>
      </header>

      {/* Quiz title */}
      <Card>
        <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Quiz Title *
        </label>
        <input
          style={inputStyle}
          placeholder="e.g. Module 3 — Databases Quiz"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Card>

      {saveMutation.isError && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--error)' }}>
            <AlertCircle size={16} />
            <span>Save failed — please try again.</span>
          </div>
        </Card>
      )}

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {questions.map((q, qIdx) => (
          <Card key={q.id}>
            {/* Question header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ flex: 1, marginRight: '1rem' }}>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Question {qIdx + 1}
                </label>
                <input
                  type="text"
                  placeholder="Enter your question…"
                  value={q.text}
                  onChange={(e) => updateQ(q.id, { text: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <button
                onClick={() => deleteQ(q.id)}
                style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.5rem' }}
                title="Delete question"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border)' }}>
              <p style={{ margin: '0 0 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Click the circle to mark the correct answer.
              </p>
              {q.options.map((opt) => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={() => setCorrect(q.id, opt.id)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: opt.isCorrect ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }}
                    title={opt.isCorrect ? 'Correct answer' : 'Mark as correct'}
                  >
                    <CheckCircle2 size={22} />
                  </button>
                  <input
                    type="text"
                    placeholder="Option text…"
                    value={opt.text}
                    onChange={(e) => updateOption(q.id, opt.id, e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  {q.options.length > 2 && (
                    <button
                      onClick={() => deleteOption(q.id, opt.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Plus size={14} />}
                style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}
                onClick={() => updateQ(q.id, { options: [...q.options, makeOption()] })}
              >
                Add Option
              </Button>
            </div>

            {/* Explanation */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Explanation (optional — shown after submission)
              </label>
              <input
                type="text"
                placeholder="Why is this the correct answer?"
                value={q.explanation ?? ''}
                onChange={(e) => updateQ(q.id, { explanation: e.target.value })}
                style={{ ...inputStyle, fontSize: '0.85rem' }}
              />
            </div>
          </Card>
        ))}

        <Button
          variant="outline"
          size="lg"
          leftIcon={<Plus size={20} />}
          style={{ alignSelf: 'center' }}
          onClick={() => setQuestions((prev) => [...prev, makeQuestion()])}
        >
          Add New Question
        </Button>
      </div>
    </div>
  );
};
