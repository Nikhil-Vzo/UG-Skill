import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, GraduationCap, ArrowLeft, Trophy, Users, Rocket } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { useAuthStore } from '../store/auth.store';
import { Logo } from '../components/ui/Logo';
import './Login.css';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, isAuthenticated, user, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.roles?.includes('admin') || user.roles?.includes('creator')) {
        navigate('/admin/analytics', { replace: true });
      } else if (user.roles?.includes('hr')) {
        navigate('/hr/dashboard', { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) clearError();
  }, [email, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <div className="login-page-container">
      {/* Sidebar Content */}
      <aside className="auth-sidebar">
        <div className="sidebar-glow"></div>
        <div className="sidebar-content">
          <div className="sidebar-logo">
            <Logo />
          </div>

          <h1 className="sidebar-headline">
            Welcome back to the <br />
            <span>Future of Learning.</span>
          </h1>

          <div className="sidebar-features">
            <div className="sidebar-feature">
              <div className="sidebar-feature-icon"><Rocket size={24} /></div>
              <div className="sidebar-feature-text">
                <h4>Career Velocity</h4>
                <p>Land your dream job faster with our enterprise network.</p>
              </div>
            </div>
            <div className="sidebar-feature">
              <div className="sidebar-feature-icon"><Trophy size={24} /></div>
              <div className="sidebar-feature-text">
                <h4>AI Leaderboards</h4>
                <p>Compete and showcase your skills on a national level.</p>
              </div>
            </div>
            <div className="sidebar-feature">
              <div className="sidebar-feature-icon"><Users size={24} /></div>
              <div className="sidebar-feature-text">
                <h4>Elite Network</h4>
                <p>Connect with industry experts and high-achievers.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          &copy; 2026 UGSkill. Pioneering Cognitive Ecosystems.
        </div>
      </aside>

      {/* Form Content */}
      <main className="auth-form-column">
        <Link to="/" className="back-to-landing">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <div className="login-ambient-1"></div>
        <div className="login-ambient-2"></div>

        <div className="login-glass-card">
          <header className="login-header">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <Logo size="lg" showText={false} />
            </div>
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">
              Sign in to access your courses, exams and placement dashboard.
            </p>
          </header>

          <form onSubmit={handleLogin} className="login-form">
            <TextInput
              label="Institutional Email"
              type="email"
              placeholder="student@ugskill.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={18} />}
              required
            />

            <TextInput
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              required
            />

            <Link to="/forgot-password" className="login-forgot-link">Forgot your password?</Link>

            {error && <div style={{ color: '#ef4444', fontSize: '0.8125rem' }}>{error}</div>}

            <Button
              type="submit"
              variant="primary"
              className="login-submit-btn"
              fullWidth
              isLoading={isLoading}
              leftIcon={<LogIn size={18} />}
            >
              Log In
            </Button>
          </form>

          <div className="login-footer">
            New student?{' '}
            <Link to="/signup" className="login-footer-link">Create an account</Link>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            <Link to="/admin" style={{ fontSize: '0.75rem', color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }}>
              Admin Portal
            </Link>
            <Link to="/hr" style={{ fontSize: '0.75rem', color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }}>
              HR Portal
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
