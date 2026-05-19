import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '../components/loaders/Skeleton';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { useAuthStore } from '../store/auth.store';
import { User, Camera, Lock, AlertCircle, CheckCircle, Save, Loader2, FileText } from 'lucide-react';
import api from '../lib/api';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  roles: string[];
  batch?: string;
  rollNumber?: string;
  cgpa?: number;
  branch?: string;
  resumeUrl?: string;
}

export const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: _authUser } = useAuthStore();
  const [tab, setTab] = useState<'profile' | 'security'>('profile');
  const [formData, setFormData] = useState({ fullName: '', branch: '', cgpa: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resumeUrl, setResumeUrl] = useState<string | undefined>(undefined);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile-me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      const p = res.data.data ?? res.data;
      setFormData({ fullName: p.fullName ?? '', branch: p.branch ?? '', cgpa: p.cgpa?.toString() ?? '' });
      if (p.avatarUrl) setAvatarUrl(p.avatarUrl);
      if (p.resumeUrl) setResumeUrl(p.resumeUrl);
      return p;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { fullName: string; branch?: string; cgpa?: number }) =>
      api.put('/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-me'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.patch('/auth/change-password', data),
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: any) => {
      setPasswordError(err?.response?.data?.message ?? 'Failed to change password.');
    },
  });

  const handleSaveProfile = () => {
    const payload: any = { fullName: formData.fullName };
    if (formData.branch) payload.branch = formData.branch;
    if (formData.cgpa) payload.cgpa = parseFloat(formData.cgpa);
    updateMutation.mutate(payload);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url: string = res.data?.data?.url ?? res.data?.url ?? res.data?.fileUrl ?? '';
      if (!url) throw new Error('No URL returned from upload');
      setAvatarUrl(url);
      // Persist to profile
      await api.put('/users/me', { avatarUrl: url });
      queryClient.invalidateQueries({ queryKey: ['profile-me'] });
    } catch {
      setAvatarError('Failed to upload photo. Please try again.');
    } finally {
      setAvatarUploading(false);
      // Reset so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeError('');
    setResumeUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url: string = res.data?.data?.url ?? res.data?.url ?? res.data?.fileUrl ?? '';
      if (!url) throw new Error('No URL returned from upload');
      setResumeUrl(url);
      // Persist to profile
      await api.put('/users/me', { resumeUrl: url });
      queryClient.invalidateQueries({ queryKey: ['profile-me'] });
    } catch {
      setResumeError('Failed to upload resume. Please try again.');
    } finally {
      setResumeUploading(false);
      // Reset so the same file can be re-selected if needed
      if (resumeInputRef.current) resumeInputRef.current.value = '';
    }
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    setPasswordError('');
    passwordMutation.mutate({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
  };

  const roleColor = (role: string) => {
    if (role === 'admin') return 'var(--error)';
    if (role === 'creator') return 'var(--warning)';
    return 'var(--primary-glow)';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h1 style={{ margin: 0, color: 'var(--text-high)', fontFamily: 'var(--font-display)', fontSize: '1.75rem' }}>My Profile</h1>
        <p style={{ margin: 0, color: 'var(--text-low)' }}>Manage your account details and security settings.</p>
      </header>

      {/* Avatar + role badges */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {isLoading ? (
          <Skeleton variant="circular" width={80} height={80} />
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            {/* Avatar circle */}
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--primary-glow)', fontWeight: 700, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <>{profile?.fullName?.charAt(0)?.toUpperCase() ?? '?'}</>
              )}
              {avatarUploading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                  <Loader2 size={20} style={{ color: 'white', animation: 'spin 1s linear infinite' }} />
                </div>
              )}
            </div>
            <button
              style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, background: 'var(--surface-highest)', border: '2px solid var(--surface-well)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-low)', borderRadius: '50%' }}
              title="Upload photo"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
            >
              <Camera size={14} />
            </button>
            {avatarError && (
              <p style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.5rem' }}>{avatarError}</p>
            )}
          </div>
        )}
        <div>
          {isLoading ? (
            <>
              <Skeleton variant="text" width="180px" height="28px" className="mb-2" />
              <Skeleton variant="text" width="140px" />
            </>
          ) : (
            <>
              <h2 style={{ margin: '0 0 0.25rem', color: 'var(--text-high)', fontSize: '1.25rem' }}>{profile?.fullName}</h2>
              <p style={{ margin: '0 0 0.5rem', color: 'var(--text-low)', fontSize: '0.875rem' }}>{profile?.email}</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(profile?.roles ?? []).map(r => (
                  <span key={r} style={{ fontSize: '0.75rem', fontWeight: 600, color: roleColor(r), border: `1px solid ${roleColor(r)}`, padding: '0.125rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {r}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--surface-highest)' }}>
        {(['profile', 'security'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.625rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: tab === t ? '2px solid var(--primary-glow)' : '2px solid transparent',
            color: tab === t ? 'var(--primary-glow)' : 'var(--text-low)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: tab === t ? 600 : 400,
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            marginBottom: '-1px',
          }}>
            {t === 'profile' ? <User size={15} /> : <Lock size={15} />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <TextInput
            label="Full Name"
            value={formData.fullName}
            onChange={e => setFormData(f => ({ ...f, fullName: e.target.value }))}
            placeholder="Your full name"
          />
          <TextInput
            label="Branch"
            value={formData.branch}
            onChange={e => setFormData(f => ({ ...f, branch: e.target.value }))}
            placeholder="e.g. Computer Science"
          />
          <TextInput
            label="CGPA"
            value={formData.cgpa}
            onChange={e => setFormData(f => ({ ...f, cgpa: e.target.value }))}
            placeholder="e.g. 8.5"
            type="number"
          />
          {updateMutation.isError && (
            <p style={{ color: 'var(--error)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: 0 }}>
              <AlertCircle size={14} /> Failed to update profile.
            </p>
          )}

          {/* Resume Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-high)' }}>Resume</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={handleResumeChange}
              />
              <Button
                variant="outline"
                leftIcon={resumeUploading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={16} />}
                onClick={() => resumeInputRef.current?.click()}
                disabled={resumeUploading}
              >
                {resumeUploading ? 'Uploading...' : 'Upload Resume'}
              </Button>
              {resumeUrl && !resumeUploading && (
                <a href={resumeUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.875rem', color: 'var(--primary-glow)', textDecoration: 'none' }}>
                  View Current Resume
                </a>
              )}
            </div>
            {resumeError && (
              <p style={{ color: 'var(--error)', fontSize: '0.75rem', margin: 0 }}>{resumeError}</p>
            )}
          </div>
          {saveSuccess && tab === 'profile' && (
            <p style={{ color: 'var(--success)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: 0 }}>
              <CheckCircle size={14} /> Profile updated successfully.
            </p>
          )}
          <Button
            variant="primary"
            leftIcon={<Save size={16} />}
            onClick={handleSaveProfile}
            disabled={updateMutation.isPending || !formData.fullName.trim()}
            style={{ alignSelf: 'flex-end' }}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}

      {/* Security tab */}
      {tab === 'security' && (
        <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <TextInput
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={e => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
            type="password"
            placeholder="Your current password"
          />
          <TextInput
            label="New Password"
            value={passwordData.newPassword}
            onChange={e => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
            type="password"
            placeholder="Min. 8 characters"
          />
          <TextInput
            label="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={e => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
            type="password"
            placeholder="Re-enter new password"
          />
          {passwordError && (
            <p style={{ color: 'var(--error)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: 0 }}>
              <AlertCircle size={14} /> {passwordError}
            </p>
          )}
          {saveSuccess && tab === 'security' && (
            <p style={{ color: 'var(--success)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: 0 }}>
              <CheckCircle size={14} /> Password changed successfully.
            </p>
          )}
          <Button
            variant="primary"
            leftIcon={<Lock size={16} />}
            onClick={handleChangePassword}
            disabled={passwordMutation.isPending || !passwordData.currentPassword}
            style={{ alignSelf: 'flex-end' }}
          >
            {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      )}
    </div>
  );
};
