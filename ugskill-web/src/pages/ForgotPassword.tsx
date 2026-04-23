import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import api from '../lib/api';
import './Login.css';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    
    try {
      await api.post('/auth/forgot-password', { email });
      setStatus('success');
      setMessage('A reset protocol has been transmitted to your email address.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to initiate reset protocol.');
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-ambient-1"></div>
      <div className="login-ambient-2"></div>

      <div className="login-glass-card">
        <header className="login-header">
          <h1 className="login-title">Reset Access</h1>
          <p className="login-subtitle">
            Re-establish your connection to the enterprise network.
          </p>
        </header>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(29,78,216,0.1)', border: '1px solid var(--primary-low)', borderRadius: '4px', color: 'var(--primary-glow)' }}>
              {message}
            </div>
            <br />
            <Link to="/login" className="login-footer-link">Return to Authentication</Link>
          </div>
        ) : (
          <form onSubmit={handleResetRequest} className="login-form">
            <TextInput
              label="Registered Email"
              type="email"
              placeholder="student@ugskill.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={18} />}
              required
            />

            <div style={{ paddingBottom: '0.5rem' }} />

            {status === 'error' && <div style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{message}</div>}

            <Button 
              type="submit" 
              variant="primary" 
              className="login-submit-btn" 
              fullWidth
              isLoading={status === 'loading'}
              leftIcon={<ArrowRight size={18} />}
            >
              Transmit Reset Link
            </Button>
          </form>
        )}

        {status !== 'success' && (
          <div className="login-footer">
            Remembered your credentials?{' '}
            <Link to="/login" className="login-footer-link">Authenticate Here</Link>
          </div>
        )}
      </div>
    </div>
  );
};
