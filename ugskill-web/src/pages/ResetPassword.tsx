import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import api from '../lib/api';
import './Login.css';

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Access tokens do not match.');
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing security token.');
      return;
    }

    setStatus('loading');
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setStatus('success');
      setMessage('Your access credentials have been securely updated.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to update credentials.');
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-ambient-1"></div>
      <div className="login-ambient-2"></div>

      <div className="login-glass-card">
        <header className="login-header">
          <h1 className="login-title">New Credentials</h1>
          <p className="login-subtitle">
            Establish a new cryptographic identity key.
          </p>
        </header>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success-low)', borderRadius: '4px', color: 'var(--success)' }}>
              {message}
            </div>
            <br />
            <Button variant="primary" onClick={() => navigate('/login')}>
              Proceed to Authentication
            </Button>
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} className="login-form">
            <TextInput
              label="New Access Token"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              required
            />

            <TextInput
              label="Confirm Access Token"
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
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
              leftIcon={<Save size={18} />}
              disabled={!token}
            >
              Finalize Update
            </Button>
          </form>
        )}

        {status !== 'success' && (
          <div className="login-footer">
             <Link to="/login" className="login-footer-link">Cancel and Return</Link>
          </div>
        )}
      </div>
    </div>
  );
};
