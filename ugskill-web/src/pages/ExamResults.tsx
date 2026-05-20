import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Award,
  Target,
  Clock,
  BookOpen,
  Brain,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../lib/api';

interface QuestionBreakdown {
  id: string;
  text: string;
  options: string[];
  userAnswer: string | number;
  userAnswerIndex: number;
  correctAnswer: string;
  correctAnswerIndex: number;
  isCorrect: boolean;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  type?: 'mcq' | 'coding' | 'math';
  codingLanguage?: string;
  codeTemplate?: string;
  testCases?: { input: string; output: string }[];
  testCasesStatus?: { input: string; output: string; expected: string; actual: string; passed: boolean }[] | null;
  presentationStyle?: 'numerical' | 'mcq';
  correctAnswerText?: string;
  tolerance?: number | string;
}

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: 'var(--surface-0)' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Analyzing attempt submissions...</span>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={{ padding: '4rem 2rem', minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--surface-0)' }}>
        <div className="surface-card noise-overlay" style={{ padding: '3rem', maxWidth: '500px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-error-subtle)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-error)' }}>
            <AlertCircle size={32} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Results Unavailable</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              We couldn't retrieve the detailed metrics for this exam attempt. It might still be grading or has been removed.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)} leftIcon={<ArrowLeft size={16} />}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const rawScoreObj = data.score;
  const scoreVal = data.totalScore ?? (rawScoreObj ? Number(rawScoreObj.totalScore) : 0);
  const maxScoreVal = data.maxScore ?? (rawScoreObj ? Number(rawScoreObj.maxScore) : 100);
  const percentVal = data.percentage ?? (rawScoreObj ? Number(rawScoreObj.percentage) : 0);
  const isPassed = data.passed ?? (rawScoreObj ? Boolean(rawScoreObj.passed) : percentVal >= 60);
  const timeTakenSecs = data.attempt?.timeTakenSecs ?? rawScoreObj?.timeTakenSecs ?? 0;
  const questions: QuestionBreakdown[] = data.questions ?? [];

  // Group by category to find topic accuracy
  const categoryStats: Record<string, { correct: number; total: number }> = {};
  questions.forEach((q) => {
    const cat = q.category || 'General';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { correct: 0, total: 0 };
    }
    categoryStats[cat].total += 1;
    if (q.isCorrect) {
      categoryStats[cat].correct += 1;
    }
  });

  const formatTime = (secs: number) => {
    if (!secs) return 'N/A';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="animate-fade-in-up" style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100vh' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft size={16} />}>
          Dashboard
        </Button>
        <span className="label-overline" style={{ fontSize: '0.8rem' }}>
          Attempt ID: {attemptId?.slice(-8) || 'N/A'}
        </span>
      </div>

      {/* Hero Stats Card */}
      <div className="surface-card noise-overlay" style={{ padding: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', alignItems: 'center' }}>
        {/* Circle Progress Score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderRight: '1px solid var(--border-default)', paddingRight: '1rem' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ transform: 'rotate(-90deg)', width: '100px', height: '100px' }}>
              <circle cx="50" cy="50" r="42" stroke="var(--surface-3)" strokeWidth="8" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={isPassed ? 'var(--color-success)' : 'var(--color-error)'}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={263.89}
                strokeDashoffset={263.89 - (263.89 * Math.min(100, Math.max(0, percentVal))) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{percentVal}%</span>
            </div>
          </div>
          <span style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score Ratio</span>
        </div>

        {/* Scoring Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              {isPassed ? 'Exam Cleared' : 'Below Cutoff'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {isPassed ? 'Congratulations! You have cleared this evaluation stage.' : 'Please review the concepts and try again in the next slot.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                backgroundColor: isPassed ? 'var(--color-success-subtle)' : 'var(--color-error-subtle)',
                color: isPassed ? 'var(--color-success)' : 'var(--color-error)',
              }}
            >
              {isPassed ? <Award size={14} /> : <AlertCircle size={14} />}
              {isPassed ? 'PASSED' : 'FAILED'}
            </span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="surface-well" style={{ padding: '0.75rem 1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <Target size={14} /> Score
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: '0.25rem' }}>
              {scoreVal} <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>/ {maxScoreVal}</span>
            </div>
          </div>
          <div className="surface-well" style={{ padding: '0.75rem 1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <Clock size={14} /> Time Taken
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: '0.25rem' }}>
              {formatTime(timeTakenSecs)}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Topic breakdown and details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Topic Accuracy Breakdown */}
        {Object.keys(categoryStats).length > 0 && (
          <div className="surface-card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Brain size={18} style={{ color: 'var(--primary)' }} />
              Topic Accuracy Breakdown
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {Object.entries(categoryStats).map(([topic, stats]) => {
                const accuracy = Math.round((stats.correct / stats.total) * 100);
                return (
                  <div key={topic} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 600 }}>{topic}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {stats.correct}/{stats.total} correct ({accuracy}%)
                      </span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--surface-3)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${accuracy}%`,
                          borderRadius: '4px',
                          backgroundColor: accuracy >= 70 ? 'var(--color-success)' : accuracy >= 40 ? 'var(--color-warning)' : 'var(--color-error)',
                          transition: 'width 0.8s ease-out',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Question Review */}
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <BookOpen size={18} style={{ color: 'var(--primary)' }} />
            Question-by-Question Review
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {questions.map((q, idx) => {
              const isQCorrect = q.isCorrect;
              return (
                <div
                  key={q.id || idx}
                  className="surface-card"
                  style={{
                    padding: '1.5rem',
                    borderLeft: `4px solid ${isQCorrect ? 'var(--color-success)' : 'var(--color-error)'}`,
                  }}
                >
                  {/* Card Header Row with Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                    <span className="label-overline" style={{ color: 'var(--text-tertiary)' }}>
                      Question {idx + 1}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Category Badge */}
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--surface-3)', color: 'var(--text-secondary)' }}>
                        {q.category || 'General'}
                      </span>
                      {/* Difficulty Badge */}
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor:
                            q.difficulty === 'hard'
                              ? 'var(--color-error-subtle)'
                              : q.difficulty === 'medium'
                              ? 'var(--color-warning-subtle)'
                              : 'var(--color-success-subtle)',
                          color:
                            q.difficulty === 'hard'
                              ? 'var(--color-error)'
                              : q.difficulty === 'medium'
                              ? 'var(--color-warning)'
                              : 'var(--color-success)',
                        }}
                      >
                        {q.difficulty || 'easy'}
                      </span>
                      {/* Marks Badge */}
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                        {q.marks || 1} mark{q.marks !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Question text */}
                  <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    {q.text}
                  </p>

                  {/* Options List / Coding Submission / Math Numerical Input */}
                  {(!q.type || q.type === 'mcq' || (q.type === 'math' && q.presentationStyle === 'mcq')) && q.options && q.options.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      {q.options.map((opt, oIdx) => {
                        const isUserSelected = q.userAnswerIndex === oIdx || q.userAnswer === opt;
                        const isCorrectOpt = q.correctAnswerIndex === oIdx || q.correctAnswer === opt;

                        let optionBg = 'var(--surface-0)';
                        let optionBorder = '1px solid var(--border-default)';
                        let optionColor = 'var(--text-primary)';

                        if (isCorrectOpt) {
                          optionBg = 'var(--color-success-subtle)';
                          optionBorder = '1px solid var(--color-success)';
                          optionColor = 'var(--color-success)';
                        } else if (isUserSelected && !isCorrectOpt) {
                          optionBg = 'var(--color-error-subtle)';
                          optionBorder = '1px solid var(--color-error)';
                          optionColor = 'var(--color-error)';
                        }

                        return (
                          <div
                            key={oIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.75rem 1rem',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: optionBg,
                              border: optionBorder,
                              color: optionColor,
                              fontSize: '0.875rem',
                              gap: '0.75rem',
                            }}
                          >
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: isCorrectOpt ? 'var(--color-success)' : isUserSelected ? 'var(--color-error)' : 'var(--surface-3)',
                                color: isCorrectOpt || isUserSelected ? 'var(--surface-0)' : 'var(--text-secondary)',
                              }}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span style={{ flex: 1 }}>{typeof opt === 'object' && opt !== null ? (opt as any).text : opt}</span>
                            {isCorrectOpt && <CheckCircle size={16} />}
                            {isUserSelected && !isCorrectOpt && <XCircle size={16} />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'coding' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.25rem' }}>
                      <div style={{ padding: '0.75rem 1rem', background: 'var(--surface-3)', borderRadius: '8px', border: '1px solid var(--border-default)', fontSize: '0.8125rem' }}>
                        Language: <strong style={{ textTransform: 'capitalize', color: 'var(--primary)' }}>{q.codingLanguage || 'javascript'}</strong>
                      </div>
                      
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Submitted Code</label>
                        <pre style={{
                          margin: 0,
                          padding: '1rem',
                          background: 'var(--surface-0)',
                          border: '1px solid var(--border-default)',
                          borderRadius: '8px',
                          color: '#e4e4e7',
                          fontFamily: 'monospace',
                          fontSize: '0.8125rem',
                          overflowX: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all'
                        }}>
                          {String(q.userAnswer || '// No code submitted')}
                        </pre>
                      </div>

                      {q.testCasesStatus && q.testCasesStatus.length > 0 && (
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Test Cases Evaluation</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {q.testCasesStatus.map((tc, tcIdx) => (
                              <div key={tcIdx} style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '6px',
                                border: `1px solid ${tc.passed ? 'var(--color-success)' : 'var(--color-error)'}`,
                                background: tc.passed ? 'var(--color-success-subtle)' : 'var(--color-error-subtle)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem',
                                fontSize: '0.8125rem',
                                fontFamily: 'monospace'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                  <span>Test Case #{tcIdx + 1}</span>
                                  <span style={{ color: tc.passed ? 'var(--color-success)' : 'var(--color-error)' }}>
                                    {tc.passed ? 'PASSED' : 'FAILED'}
                                  </span>
                                </div>
                                <div style={{ color: 'var(--text-secondary)' }}>Input: {tc.input}</div>
                                <div style={{ color: 'var(--text-secondary)' }}>Expected: {tc.expected}</div>
                                <div style={{ color: tc.passed ? 'var(--color-success)' : 'var(--color-error)' }}>Actual: {tc.actual ?? 'undefined'}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {q.type === 'math' && q.presentationStyle === 'numerical' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: q.isCorrect ? 'var(--color-success-subtle)' : 'var(--color-error-subtle)',
                        border: `1px solid ${q.isCorrect ? 'var(--color-success)' : 'var(--color-error)'}`,
                        color: q.isCorrect ? 'var(--color-success)' : 'var(--color-error)',
                        fontSize: '0.875rem',
                        gap: '1rem',
                      }}>
                        {q.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span>Your Answer: <strong style={{ fontFamily: 'monospace' }}>{String(q.userAnswer ?? 'N/A')}</strong></span>
                          <span>Correct Answer: <strong style={{ fontFamily: 'monospace' }}>{q.correctAnswerText}</strong></span>
                          {(() => {
                            const correctNum = parseFloat(q.correctAnswerText || '');
                            const tolerance = parseFloat(String(q.tolerance || 0));
                            if (!isNaN(correctNum) && tolerance > 0) {
                              const allowed = Math.abs(correctNum) * (tolerance / 100);
                              const minVal = correctNum - allowed;
                              const maxVal = correctNum + allowed;
                              return (
                                <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                                  Allowed Range: <strong style={{ fontFamily: 'monospace' }}>[{minVal.toFixed(4)}, {maxVal.toFixed(4)}]</strong> (±{tolerance}%)
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Footer */}
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Status:
                      <strong style={{ color: isQCorrect ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {isQCorrect ? 'Correct' : 'Incorrect'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Earned: <strong>{isQCorrect ? q.marks || 1 : 0}</strong> points
                    </span>
                  </div>
                </div>
              );
            })}

            {questions.length === 0 && (
              <div className="surface-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No question breakdown could be hydrated for this test.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

