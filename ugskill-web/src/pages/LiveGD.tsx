import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LiveGD: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.badge}>
          <Sparkles size={12} style={{ marginRight: '6px' }} /> Launching soon
        </div>
        <div style={styles.iconContainer}>
          <Radio size={40} color="#14b8a6" />
          <div style={styles.pulseRing} />
        </div>
        <h1 style={styles.title}>Live Group Discussions</h1>
        <p style={styles.description}>
          Interactive peer-to-peer discussion sessions powered by real-time audio/video streaming and AI facilitation. This feature is currently inactive and will launch soon.
        </p>
        <div style={styles.divider} />
        <Button 
          variant="primary" 
          onClick={() => navigate('/app')}
          style={styles.button}
        >
          <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#030712',
    padding: '2rem',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  card: {
    maxWidth: '480px',
    width: '100%',
    background: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '3rem 2.5rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.35rem 0.85rem',
    background: 'rgba(20, 184, 166, 0.1)',
    border: '1px solid rgba(20, 184, 166, 0.25)',
    borderRadius: '100px',
    color: '#2dd4bf',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '2rem',
  },
  iconContainer: {
    position: 'relative',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(20, 184, 166, 0.05)',
    border: '1px solid rgba(20, 184, 166, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
    boxShadow: '0 0 20px rgba(20, 184, 166, 0.05)',
  },
  pulseRing: {
    position: 'absolute',
    inset: '-8px',
    borderRadius: '50%',
    border: '1px dashed rgba(20, 184, 166, 0.2)',
    opacity: 0.8,
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#f8fafc',
    margin: '0 0 0.75rem',
    letterSpacing: '-0.02em',
  },
  description: {
    fontSize: '0.9375rem',
    color: '#94a3b8',
    lineHeight: 1.6,
    margin: '0 0 2rem',
  },
  divider: {
    width: '100%',
    height: '1px',
    background: 'rgba(255, 255, 255, 0.06)',
    marginBottom: '2rem',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
  }
};

export default LiveGD;
