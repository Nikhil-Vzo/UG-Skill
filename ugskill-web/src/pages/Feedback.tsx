import React from 'react';
import { MessageSquare, Star, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Feedback page for students to view all received feedback across modules.
 */
export const Feedback: React.FC = () => {
  const navigate = useNavigate();

  // Mock feedback data
  const feedbacks = [
    {
      id: 1,
      type: 'Mock Interview',
      title: 'Technical Round 1',
      date: 'Oct 24, 2023',
      score: '8/10',
      comment: 'Strong problem-solving skills. Need to work on communication clarity during complex algorithm explanations.',
      reviewer: 'Alex P. (Senior SDE)'
    },
    {
      id: 2,
      type: 'Assignment',
      title: 'React Capstone Project',
      date: 'Oct 20, 2023',
      score: '95/100',
      comment: 'Excellent code structure and use of custom hooks. UI is polished. Just missed a few edge cases in form validation.',
      reviewer: 'Sarah K. (Instructor)'
    },
    {
      id: 3,
      type: 'Course Review',
      title: 'Advanced System Design',
      date: 'Oct 15, 2023',
      score: '4.5/5',
      comment: 'Your participation in the system design discussions has been outstanding.',
      reviewer: 'Auto-Graded System'
    }
  ];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={styles.title}>My Feedback & Reviews</h1>
      </div>

      <div style={styles.container}>
        {feedbacks.map(f => (
          <div key={f.id} className="surface-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.badge}>{f.type}</div>
              <div style={styles.date}>{f.date}</div>
            </div>
            
            <h2 style={styles.cardTitle}>{f.title}</h2>
            
            <div style={styles.scoreRow}>
              <Star size={16} fill="var(--warning)" color="var(--warning)" />
              <span style={styles.scoreText}>Score: {f.score}</span>
            </div>
            
            <div style={styles.commentBox}>
              <MessageSquare size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={styles.comment}>{f.comment}</p>
            </div>
            
            <div style={styles.reviewer}>
              Reviewed by: <strong>{f.reviewer}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '2rem',
    maxWidth: 1000,
    margin: '0 auto',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  backBtn: {
    background: 'var(--surface-well)',
    border: '1px solid var(--border)',
    color: 'var(--text-high)',
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--text-highest)'
  },
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    background: 'var(--surface)',
    borderRadius: 16,
    border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badge: {
    background: 'var(--primary-glow)',
    color: 'var(--primary)',
    padding: '0.25rem 0.75rem',
    borderRadius: 20,
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  date: {
    color: 'var(--text-muted)',
    fontSize: '0.875rem'
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--text-high)'
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  scoreText: {
    color: 'var(--text-highest)',
    fontWeight: 700,
    fontSize: '0.875rem'
  },
  commentBox: {
    background: 'var(--surface-well)',
    padding: '1rem',
    borderRadius: 8,
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start'
  },
  comment: {
    color: 'var(--text-low)',
    fontSize: '0.875rem',
    lineHeight: 1.5,
    margin: 0
  },
  reviewer: {
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    marginTop: 'auto',
    paddingTop: '0.5rem',
    borderTop: '1px solid var(--border)'
  }
};
