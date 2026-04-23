import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Briefcase, Users, BarChart2, CheckCircle, LogIn, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import api, { tokenStore } from '../lib/api';
import toast from 'react-hot-toast';
import './portals.css';

interface InviteData {
  email: string;
  role: string;
  companyName?: string;
  expiresAt: string;
}

export const HRLogin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [mode, setMode] = useState<'login' | 'accept-invite'>(token ? 'accept-invite' : 'login');
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!token);
  const [inviteError, setInviteError] = useState('');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  // Accept-invite form state
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptLoading, setAcceptLoading] = useState(false);

  // Validate invite token on mount
  useEffect(() => {
    if (!token) return;
    setInviteLoading(true);
    api.get(`/auth/invite/${token}`)
      .then(res => {
        setInviteData(res.data.data);
        setInviteLoading(false);
      })
      .catch(() => {
        setInviteError('This invite link is invalid or has expired. Contact the UGSkill team for a new invite.');
        setInviteLoading(false);
      });
  }, [token]);

  // Redirect HR after login
  useEffect(() => {
    if (isAuthenticated && user) {
      const isHR = user.roles?.includes('hr') || user.roles?.includes('admin');
      if (isHR) {
        navigate('/hr/dashboard', { replace: true });
      } else {
        toast.error('This portal is for HR partners only. Please use the Student Portal.');
        useAuthStore.getState().logout('');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setAcceptLoading(true);
    try {
      const res = await api.post('/auth/invite/accept', {
        token,
        fullName,
        password: newPassword,
      });
      const { accessToken, refreshToken, user: newUser } = res.data.data;
      // Hydrate auth store manually
      tokenStore.setTokens(accessToken, refreshToken);
      toast.success(`Welcome, ${newUser.fullName}! Your account is ready.`);
      navigate('/hr/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to activate account. Please try again.');
    } finally {
      setAcceptLoading(false);
    }
  };

  const LeftPanel = () => (
    <div className="hr-portal-left">
      <div className="hr-portal-bg-dots" />
      <div className="hr-portal-bg-glow-1" />
      <div className="hr-portal-bg-glow-2" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="hr-portal-badge">
          <Briefcase size={13} />
          Recruiter Portal
        </div>

        <h1 className="hr-portal-tagline">
          Discover and hire<br />
          <span>top talent</span> from<br />
          UGSkill
        </h1>

        <p className="hr-portal-desc">
          Access curated student profiles, run placement drives, schedule interviews, and shortlist candidates — all in one secure platform.
        </p>

        <div className="hr-portal-features">
          <div className="hr-feature-item">
            <div className="hr-feature-icon"><Users size={16} /></div>
            Browse verified student profiles with skills & scores
          </div>
          <div className="hr-feature-item">
            <div className="hr-feature-icon"><Briefcase size={16} /></div>
            Post drives and manage applicant pipelines
          </div>
          <div className="hr-feature-item">
            <div className="hr-feature-icon"><BarChart2 size={16} /></div>
            Real-time analytics on your hiring processes
          </div>
        </div>
      </div>
    </div>
  );

  // ── Invite loading state ───────────────────────────────
  if (inviteLoading) {
    return (
      <div className="hr-portal-page">
        <LeftPanel />
        <div className="hr-portal-right">
          <div className="hr-portal-card">
            <div style={{ textAlign: 'center', color: '#2dd4bf', padding: '3rem 0' }}>
              <div style={{ width: 40, height: 40, border: '3px solid rgba(20,184,166,0.2)', borderTopColor: '#14b8a6', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: '#475569', fontSize: '0.9rem' }}>Validating your invite…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Invalid token state ────────────────────────────────
  if (token && inviteError) {
    return (
      <div className="hr-portal-page">
        <LeftPanel />
        <div className="hr-portal-right">
          <div className="hr-portal-card">
            <div className="admin-portal-logo">
              <div className="hr-portal-logo-icon"><Briefcase size={20} /></div>
              <div>
                <div className="admin-portal-logo-name">UGSkill</div>
                <div className="hr-portal-logo-sub">HR Portal</div>
              </div>
            </div>
            <div className="admin-portal-error" style={{ borderColor: 'rgba(239,68,68,0.3)', marginTop: '1rem' }}>
              <AlertCircle size={15} style={{ marginRight: '0.5rem', display: 'inline' }} />
              {inviteError}
            </div>
            <Link to="/hr" style={{ color: '#2dd4bf', fontSize: '0.875rem', textDecoration: 'none' }}>
              ← Back to HR Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Invite accept form ─────────────────────────────────
  if (mode === 'accept-invite' && inviteData) {
    return (
      <div className="hr-portal-page">
        <LeftPanel />
        <div className="hr-portal-right">
          <div className="hr-portal-card">
            <div className="admin-portal-logo">
              <div className="hr-portal-logo-icon"><Briefcase size={20} /></div>
              <div>
                <div className="admin-portal-logo-name">UGSkill</div>
                <div className="hr-portal-logo-sub">HR Portal</div>
              </div>
            </div>

            <div>
              <h2 className="hr-portal-heading">Accept Your Invitation</h2>
              <p className="hr-portal-subheading">Set up your recruiter account to get started.</p>
            </div>

            <div className="hr-invite-form-header">
              {inviteData.companyName && (
                <div className="hr-invite-company">{inviteData.companyName}</div>
              )}
              <div className="hr-invite-email">{inviteData.email}</div>
            </div>

            <form className="admin-portal-form" onSubmit={handleAcceptInvite}>
              <div className="admin-input-group">
                <label className="admin-input-label" style={{ color: '#64748b' }}>Your Full Name</label>
                <div className="admin-input-wrap">
                  <span className="admin-input-icon"><Users size={16} /></span>
                  <input
                    type="text"
                    className="hr-input"
                    placeholder="Jane Smith"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="admin-input-group">
                <label className="admin-input-label" style={{ color: '#64748b' }}>Create Password</label>
                <div className="admin-input-wrap">
                  <span className="admin-input-icon"><Lock size={16} /></span>
                  <input
                    type="password"
                    className="hr-input"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="admin-input-group">
                <label className="admin-input-label" style={{ color: '#64748b' }}>Confirm Password</label>
                <div className="admin-input-wrap">
                  <span className="admin-input-icon"><Lock size={16} /></span>
                  <input
                    type="password"
                    className="hr-input"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="hr-submit-btn" disabled={acceptLoading}>
                {acceptLoading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    Setting up account…
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Activate Account & Sign In
                  </>
                )}
              </button>
            </form>

            <div className="hr-portal-notice">
              <span className="hr-portal-notice-icon"><AlertCircle size={15} /></span>
              This invite link expires 72 hours after it was sent.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Standard login form ────────────────────────────────
  return (
    <div className="hr-portal-page">
      <LeftPanel />
      <div className="hr-portal-right">
        <Link to="/" className="back-to-landing">
          <ArrowLeft size={18} />
          Back to Home
        </Link>
        <div className="hr-portal-card">
          <div className="admin-portal-logo">
            <div className="hr-portal-logo-icon"><Briefcase size={20} /></div>
            <div>
              <div className="admin-portal-logo-name">UGSkill</div>
              <div className="hr-portal-logo-sub">HR Portal</div>
            </div>
          </div>

          <div>
            <h2 className="hr-portal-heading">Recruiter Sign In</h2>
            <p className="hr-portal-subheading">
              Access your company's placement dashboard and applicant pipeline.
            </p>
          </div>

          <form className="admin-portal-form" onSubmit={handleLogin}>
            <div className="admin-input-group">
              <label className="admin-input-label" style={{ color: '#64748b' }}>Work Email</label>
              <div className="admin-input-wrap">
                <span className="admin-input-icon"><Mail size={16} /></span>
                <input
                  type="email"
                  className="hr-input"
                  placeholder="recruiter@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="admin-input-group">
              <label className="admin-input-label" style={{ color: '#64748b' }}>Password</label>
              <div className="admin-input-wrap">
                <span className="admin-input-icon"><Lock size={16} /></span>
                <input
                  type="password"
                  className="hr-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <div className="admin-portal-error">{error}</div>}

            <button type="submit" className="hr-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Access Recruiter Portal
                </>
              )}
            </button>
          </form>

          <div className="hr-portal-notice">
            <span className="hr-portal-notice-icon"><AlertCircle size={15} /></span>
            Access is by invitation only. If your company is not yet onboarded,
            contact the UGSkill placements team to get your invite link.
          </div>

          <div className="hr-portal-back-link">
            Are you a student?{' '}
            <Link to="/login">Student Portal <ArrowRight size={12} style={{ display: 'inline' }} /></Link>
          </div>
        </div>
      </div>
    </div>
  );
};
