import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ChevronRight, Briefcase, Users, Star } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { Logo } from '../components/ui/Logo';
import { useAuthStore } from '../store/auth.store';
import './Login.css';

export const Signup: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const { register, isLoading, error, isAuthenticated, clearError } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when user edits any field
  useEffect(() => {
    if (error) clearError();
    if (validationError) setValidationError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullName, email, password]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setValidationError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setValidationError('Password must contain at least one number');
      return;
    }
    setValidationError('');
    await register({ fullName, email, password });
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
              Shape your <br />
              <span className="text-gradient">Future.</span>
            </h1>
            
            <div className="sidebar-features">
              <div className="sidebar-feature">
                <div className="sidebar-feature-icon">
                  <Briefcase size={24} />
                </div>
                <div className="sidebar-feature-text">
                  <h4>Career Growth</h4>
                  <p>Access exclusive placement drives and internships.</p>
                </div>
              </div>

              <div className="sidebar-feature">
                <div className="sidebar-feature-icon">
                  <Users size={24} />
                </div>
                <div className="sidebar-feature-text">
                  <h4>Collaborative Projects</h4>
                  <p>Work on real-world problems with a global peer network.</p>
                </div>
              </div>

              <div className="sidebar-feature">
                <div className="sidebar-feature-icon">
                  <Star size={24} />
                </div>
                <div className="sidebar-feature-text">
                  <h4>Showcase Talent</h4>
                  <p>Build a dynamic portfolio that gets you noticed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <p>© 2026 UGSkill Cognitive Ecosystem. All rights reserved.</p>
        </div>
      </aside>

      {/* ── Right Section: Signup Form ── */}
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
            <h2 className="login-title">Join UGSkill</h2>
            <p className="login-subtitle">
              Create your account to start your learning journey.
            </p>
          </header>

          <form onSubmit={handleSignup} className="login-form">
            <TextInput
              label="Full Name"
              type="text"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User size={20} />}
              required
            />

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

            {validationError && <div className="auth-error-message">{validationError}</div>}
            {error && !validationError && <div className="auth-error-message">{error}</div>}

            <Button
              type="submit"
              variant="primary"
              className="login-submit-btn"
              fullWidth
              isLoading={isLoading}
              leftIcon={<UserPlus size={20} />}
            >
              Create Account
            </Button>
          </form>

          <div className="login-footer">
            Already have an account?{' '}
            <Link to="/login" className="login-footer-link">Sign In</Link>
          </div>

          <div className="portal-switcher">
            <div className="switcher-label">Looking for other portals?</div>
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

