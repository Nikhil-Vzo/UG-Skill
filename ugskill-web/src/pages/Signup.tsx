import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ArrowLeft, CheckCircle, Zap, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { useAuthStore } from '../store/auth.store';
import { Logo } from '../components/ui/Logo';
import './Login.css';

export const Signup: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading, error, isAuthenticated, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) clearError();
  }, [fullName, email, password]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    await register({ fullName, email, password });
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
            Start your <br />
            <span>Success Story.</span>
          </h1>

          <div className="sidebar-features">
            <div className="sidebar-feature">
              <div className="sidebar-feature-icon"><Zap size={24} /></div>
              <div className="sidebar-feature-text">
                <h4>AI Roadmaps</h4>
                <p>Personalized learning paths that adapt in real-time.</p>
              </div>
            </div>
            <div className="sidebar-feature">
              <div className="sidebar-feature-icon"><CheckCircle size={24} /></div>
              <div className="sidebar-feature-text">
                <h4>Verified Skills</h4>
                <p>Earn certificates trusted by top-tier partners.</p>
              </div>
            </div>
            <div className="sidebar-feature">
              <div className="sidebar-feature-icon"><Shield size={24} /></div>
              <div className="sidebar-feature-text">
                <h4>Direct Placement</h4>
                <p>Exclusive access to hiring drives and mentors.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          &copy; 2026 UGSkill. India's First Cognitive Learning Ecosystem.
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
            <h1 className="login-title">Create Account</h1>
            <p className="login-subtitle">
              Join thousands of students mastering high-demand skills and landing top tier placements.
            </p>
          </header>

          <form onSubmit={handleSignup} className="login-form">
            <TextInput
              label="Full Name"
              type="text"
              placeholder="Nikhil Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User size={18} />}
              required
            />

            <TextInput
              label="Email Address"
              type="email"
              placeholder="nikhil@example.com"
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

            {error && <div style={{ color: '#ef4444', fontSize: '0.8125rem' }}>{error}</div>}

            <Button
              type="submit"
              variant="primary"
              className="login-submit-btn"
              fullWidth
              isLoading={isLoading}
              leftIcon={<UserPlus size={18} />}
            >
              Sign Up
            </Button>
          </form>

          <div className="login-footer">
            Already have an account?{' '}
            <Link to="/login" className="login-footer-link">Sign In</Link>
          </div>
        </div>
      </main>
    </div>
  );
};
