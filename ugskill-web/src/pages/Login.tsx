import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ChevronRight, GraduationCap, ShieldCheck, Zap, Globe } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { Logo } from '../components/ui/Logo';
import { useAuthStore } from '../store/auth.store';
import './Login.css';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, isAuthenticated, user, clearError } = useAuthStore();
  const navigate = useNavigate();

  // Role-based redirect after login
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

  // Clear errors when user starts typing
  useEffect(() => {
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <div className="login-page-container">
      {/* ── Left Sidebar: Brand & Value Prop ── */}
      <aside className="auth-sidebar">
        <div className="sidebar-glow"></div>
        
        <div className="sidebar-content">
          <div className="sidebar-logo">
            <Logo size="md" />
          </div>

          <div className="sidebar-main-content">
            <h1 className="sidebar-headline">
              Master the Skills <br />
              <span className="text-gradient">that Matter.</span>
            </h1>
            
            <div className="sidebar-features">
              <div className="sidebar-feature">
                <div className="sidebar-feature-icon">
                  <ShieldCheck size={24} />
                </div>
                <div className="sidebar-feature-text">
                  <h4>Industry Recognized</h4>
                  <p>Our certifications are trusted by top-tier global companies.</p>
                </div>
              </div>

              <div className="sidebar-feature">
                <div className="sidebar-feature-icon">
                  <Zap size={24} />
                </div>
                <div className="sidebar-feature-text">
                  <h4>AI-Powered Learning</h4>
                  <p>Adaptive curriculum that evolves with your progress.</p>
                </div>
              </div>

              <div className="sidebar-feature">
                <div className="sidebar-feature-icon">
                  <Globe size={24} />
                </div>
                <div className="sidebar-feature-text">
                  <h4>Global Community</h4>
                  <p>Connect with peers and mentors from around the world.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <p>© 2024 UGSkill Cognitive Ecosystem. All rights reserved.</p>
        </div>
      </aside>

      {/* ── Right Section: Login Form ── */}
      <section className="auth-form-column">
        <div className="login-ambient-1"></div>
        <div className="login-ambient-2"></div>

        <Link to="/" className="back-to-landing">
          Back to website <ChevronRight size={14} />
        </Link>

        <div className="login-glass-card">
          <header className="login-header">
            <div className="mobile-only-logo">
              <Logo size="sm" />
            </div>
            <h2 className="login-title">Welcome back</h2>
            <p className="login-subtitle">
              Sign in to your student account to continue your journey.
            </p>
          </header>

          <form onSubmit={handleLogin} className="login-form">
            <TextInput
              label="Email Address"
              type="email"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={20} />}
              required
            />

            <TextInput
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={20} />}
              required
            />

            <div className="login-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" title="Forgot Password?" className="login-forgot-link">Forgot password?</Link>
            </div>

            {error && <div className="auth-error-message">{error}</div>}

            <Button
              type="submit"
              variant="primary"
              className="login-submit-btn"
              fullWidth
              isLoading={isLoading}
              leftIcon={<LogIn size={20} />}
            >
              Sign In
            </Button>
          </form>

          <div className="login-footer">
            Don't have an account?{' '}
            <Link to="/signup" className="login-footer-link">Join the ecosystem</Link>
          </div>

          <div className="portal-switcher">
            <div className="switcher-label">Need a different portal?</div>
            <div className="switcher-links">
              <Link to="/admin">Admin</Link>
              <span className="dot">•</span>
              <Link to="/hr">Recruiters</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

