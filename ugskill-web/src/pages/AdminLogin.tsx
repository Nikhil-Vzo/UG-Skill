import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, AlertCircle, LogIn, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import './portals.css';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [portalError, setPortalError] = useState('');

  const { login, isLoading, error, isAuthenticated, user, clearError } = useAuthStore();
  const navigate = useNavigate();

  // After successful login, validate that this is an admin/creator account
  useEffect(() => {
    if (isAuthenticated && user) {
      const isAdmin = user.roles?.includes('admin') || user.roles?.includes('creator');
      if (isAdmin) {
        navigate('/app/admin/analytics', { replace: true });
      } else {
        // Logged in but not admin — show a portal-specific error
        setPortalError('This portal is for administrators only. Please use the Student Portal.');
        useAuthStore.getState().logout('');
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error || portalError) {
      setPortalError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPortalError('');
    clearError();
    await login({ email, password });
  };

  return (
    <div className="admin-portal-page">
      <Link to="/" className="portal-back-home">
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </Link>
      {/* Left — Branding */}
      <div className="admin-portal-left">
        <div className="admin-portal-bg-grid" />
        <div className="admin-portal-bg-glow-1" />
        <div className="admin-portal-bg-glow-2" />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="admin-portal-badge">
            <ShieldCheck size={13} />
            Administration Portal
          </div>

          <h1 className="admin-portal-tagline">
            Your command<br />
            center for <span>UGSkill</span>
          </h1>

          <p className="admin-portal-desc">
            Manage students, courses, exams, placement drives and analytics from one secure platform.
            Access is strictly provisioned.
          </p>

          <div className="admin-portal-stats">
            <div className="admin-stat">
              <div className="admin-stat-value">Full</div>
              <div className="admin-stat-label">Platform Control</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-value">Real-time</div>
              <div className="admin-stat-label">Analytics</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-value">Audit</div>
              <div className="admin-stat-label">Log Every Action</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="admin-portal-right">
        <div className="admin-portal-card">
          {/* Logo */}
          <div className="admin-portal-logo">
            <div className="admin-portal-logo-icon">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="admin-portal-logo-name">UGSkill</div>
              <div className="admin-portal-logo-sub">Admin Portal</div>
            </div>
          </div>

          <div>
            <h2 className="admin-portal-heading">Administrator Sign In</h2>
            <p className="admin-portal-subheading">
              Secure access for platform administrators and content creators.
            </p>
          </div>

          <form className="admin-portal-form" onSubmit={handleSubmit}>
            <div className="admin-input-group">
              <label className="admin-input-label">Email Address</label>
              <div className="admin-input-wrap">
                <span className="admin-input-icon"><Mail size={16} /></span>
                <input
                  type="email"
                  className="admin-input"
                  placeholder="admin@ugskill.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="admin-input-group">
              <label className="admin-input-label">Password</label>
              <div className="admin-input-wrap">
                <span className="admin-input-icon"><Lock size={16} /></span>
                <input
                  type="password"
                  className="admin-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {(error || portalError) && (
              <div className="admin-portal-error">
                {portalError || error}
              </div>
            )}

            <button type="submit" className="admin-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(10,12,16,0.3)', borderTopColor: '#0a0c10', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Authenticating…
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In to Admin Panel
                </>
              )}
            </button>
          </form>

          <div className="admin-portal-notice">
            <span className="admin-portal-notice-icon"><AlertCircle size={15} /></span>
            <span>
              Account access is provisioned by the platform owner. There is no self-registration for this portal.
              Contact your administrator if you need access.
            </span>
          </div>

          <div className="admin-portal-back-link">
            Not an admin?{' '}
            <Link to="/login">Student Portal →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
