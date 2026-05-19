import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../lib/api';

export const ExamResults: React.FC = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['examResults', attemptId],
    queryFn: async () => {
      const res = await api.get(`/exams/results/${attemptId}`);
      return res.data.data ?? res.data;
    },
    enabled: !!attemptId,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={{ padding: '2rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AlertCircle size={20} />
        <span>Failed to load exam results.</span>
      </div>
    );
  }

  const { score, maxScore, questions, percentage } = data;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft size={16} />}>
          Back
        </Button>
      </div>

      <div className="surface-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', margin: '0 0 1rem 0' }}>Exam Results</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
              {score ?? 0} <span style={{ fontSize: '1rem', color: 'var(--text-low)' }}>/ {maxScore ?? 0}</span>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Score</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: (percentage ?? 0) >= 60 ? 'var(--success)' : 'var(--error)', fontFamily: 'var(--font-display)' }}>
              {percentage ?? 0}%
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Percentage</div>
          </div>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Questions Breakdown</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions?.map((q: any, i: number) => {
            const isCorrect = q.isCorrect || (q.userAnswer === q.correctAnswer);
            return (
              <div key={q.id || i} className="surface-card" style={{ padding: '1.5rem', borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}` }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-low)', marginRight: '0.5rem' }}>Q{i + 1}.</span>
                      {q.questionText || q.text}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', fontSize: '0.875rem' }}>
                      <div style={{ color: isCorrect ? 'var(--success)' : 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 500 }}>Your Answer:</span>
                        {q.userAnswer}
                        {isCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      </div>
                      {!isCorrect && q.correctAnswer && (
                        <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 500 }}>Correct Answer:</span>
                          {q.correctAnswer}
                          <CheckCircle size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {(!questions || questions.length === 0) && (
            <div style={{ textAlign: 'center', color: 'var(--text-low)', padding: '2rem' }}>
              No question details available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
