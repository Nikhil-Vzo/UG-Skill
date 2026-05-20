import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import api from '../../../lib/api';

interface ReportQuestionModalProps {
  examId: string;
  attemptId: string;
  questionId: string;
  onClose: () => void;
}

export const ReportQuestionModal: React.FC<ReportQuestionModalProps> = ({
  examId,
  attemptId,
  questionId,
  onClose,
}) => {
  const [issueType, setIssueType] = useState('Typo / Grammar error');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a short description of the issue.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.post(`/exams/${examId}/attempts/${attemptId}/questions/${questionId}/report`, {
        issueType,
        description,
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9,10,15,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
      }}
    >
      <div
        className="glass-panel animate-scale-in"
        style={{
          width: '450px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-high)', margin: 0, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} style={{ color: 'var(--warning)' }} />
            Report Question Issue
          </h2>
          {!submitted && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <CheckCircle2 size={44} style={{ color: 'var(--success)' }} />
            <div>
              <h3 style={{ color: 'var(--text-high)', margin: '0 0 0.25rem' }}>Report Submitted</h3>
              <p style={{ color: 'var(--text-low)', fontSize: '0.875rem', margin: 0 }}>Thank you, the review has been flagged for administrators.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.75rem', fontSize: '0.8125rem' }}>
                {error}
              </div>
            )}

            {/* Issue Category selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-medium)' }}>Issue Type</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                style={{
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-well)',
                  color: 'var(--text-high)',
                  border: '1px solid var(--surface-highest)',
                  outline: 'none',
                }}
              >
                <option value="Typo / Grammar error">Typo / Grammar error</option>
                <option value="Incorrect options / choices">Incorrect options / choices</option>
                <option value="Missing content / diagrams">Missing content / diagrams</option>
                <option value="Ambiguous question text">Ambiguous question text</option>
                <option value="Incorrect correct answer key">Incorrect correct answer key</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Explanation box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-medium)' }}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the error in detail..."
                rows={4}
                style={{
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-well)',
                  color: 'var(--text-high)',
                  border: '1px solid var(--surface-highest)',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button type="button" variant="ghost" fullWidth onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>
                Submit Report
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
