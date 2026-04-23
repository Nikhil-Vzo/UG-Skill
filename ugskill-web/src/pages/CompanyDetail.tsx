import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Briefcase, Users, Clock,
  CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Code2, MessageSquare
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/loaders/Skeleton';
import api from '../lib/api';

const ROUND_ICONS: Record<string, React.ReactNode> = {
  coding: <Code2 size={16} />,
  interview: <MessageSquare size={16} />,
  hr: <Users size={16} />,
};

/* ─────────── Component ─────────── */
export const CompanyDetail: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['drive', driveId],
    queryFn: async () => {
      const res = await api.get(`/placements/drives/${driveId}`);
      return res.data.data ?? res.data;
    },
    enabled: !!driveId,
  });

  const applyMutation = useMutation({
    mutationFn: () => api.post(`/placements/drives/${driveId}/apply`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drive', driveId] });
    },
  });

  const hasApplied = company?.myStatus && company.myStatus !== 'none';
  const statusLabel: Record<string, string> = {
    applied: '✓ Application Submitted',
    shortlisted: '✓ Shortlisted',
    rejected: 'Not Selected',
    selected: '✓ Selected!',
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <Skeleton variant="text" width="120px" height="20px" />
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <Skeleton variant="rectangular" height={80} />
        </div>
        <Skeleton variant="rectangular" height={300} />
      </div>
    );
  }

  // Error state
  if (error || !company) {
    return (
      <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
        <button onClick={() => navigate('/placements')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '2rem' }}>
          <ArrowLeft size={16} /> Back to Drives
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--error)', background: 'var(--error-container)', padding: '1rem', borderLeft: '4px solid var(--error)' }}>
          <AlertCircle size={20} />
          <span>Failed to load drive details. The drive may not exist or is no longer available.</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Back */}
      <button onClick={() => navigate('/placements')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: '0.875rem', width: 'fit-content' }}>
        <ArrowLeft size={16} /> Back to Drives
      </button>

      {/* Hero Card */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, background: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: 'white', flexShrink: 0 }}>
            {(company.company || company.name || '?').charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-high)', margin: 0 }}>{company.company || company.name}</h1>
              <Badge variant={company.status === 'open' ? 'success' : 'warning'} size="sm">
                {company.status === 'open' ? 'Hiring Open' : company.status}
              </Badge>
            </div>
            <p style={{ color: 'var(--text-low)', fontSize: '1rem', margin: '0 0 0.75rem' }}>{company.role}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.875rem', color: 'var(--text-low)' }}>
              {company.location && <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><MapPin size={14} />{company.location}</span>}
              {company.package && <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Briefcase size={14} />{company.package}</span>}
              {company.seats && <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Users size={14} />{company.seats} seats</span>}
              {company.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={14} />Deadline: {new Date(company.deadline).toLocaleDateString()}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', alignItems: 'flex-end' }}>
            <Button
              variant="primary"
              size="lg"
              leftIcon={hasApplied ? <CheckCircle size={16} /> : <CheckCircle size={16} />}
              onClick={() => applyMutation.mutate()}
              disabled={hasApplied || applyMutation.isPending}
            >
              {applyMutation.isPending ? 'Applying...' : hasApplied ? (statusLabel[company.myStatus] ?? '✓ Applied') : 'Apply Now'}
            </Button>
            {hasApplied && <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Application under review</span>}
            {applyMutation.isError && <span style={{ fontSize: '0.75rem', color: 'var(--error)' }}>Failed to apply. Try again.</span>}
          </div>
        </div>

        {/* Eligibility pills */}
        {(company.branches?.length || company.cgpaCutoff) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--surface-highest)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-lowest)' }}>Eligible branches:</span>
            {(company.branches ?? []).map((b: string) => <Badge key={b} variant="outline" size="sm">{b}</Badge>)}
            {company.cgpaCutoff && <Badge variant="warning" size="sm">CGPA ≥ {company.cgpaCutoff}</Badge>}
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Description */}
          {company.description && (
            <div className="surface-card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-high)', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>About the Role</h2>
              <p style={{ color: 'var(--text-low)', fontSize: '0.9375rem', lineHeight: 1.7 }}>{company.description}</p>
            </div>
          )}

          {/* Selection Rounds */}
          {company.rounds?.length > 0 && (
            <div className="surface-card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-high)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Selection Process</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {company.rounds.map((r: any, i: number) => (
                  <div key={r.id ?? i}>
                    <button
                      onClick={() => setExpanded(expanded === (r.id ?? i) ? null : (r.id ?? i))}
                      style={{ width: '100%', background: 'transparent', border: '1px solid var(--surface-highest)', padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: 'var(--text-high)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 28, height: 28, background: 'var(--primary-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0, color: 'var(--primary-glow)', flexShrink: 0 }}>
                          {ROUND_ICONS[r.type] ?? <MessageSquare size={16} />}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Round {i + 1}: {r.label}</div>
                          {r.duration && <div style={{ fontSize: '0.75rem', color: 'var(--text-low)' }}><Clock size={11} style={{ display: 'inline', marginRight: 3 }} />{r.duration}</div>}
                        </div>
                      </div>
                      {expanded === (r.id ?? i) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expanded === (r.id ?? i) && (
                      <div style={{ padding: '0.875rem 1rem', background: 'var(--surface-well)', border: '1px solid var(--surface-highest)', borderTop: 'none', fontSize: '0.875rem', color: 'var(--text-low)', lineHeight: 1.6 }}>
                        {r.desc ?? r.description ?? 'No description available.'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {company.requirements?.length > 0 && (
            <div className="surface-card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-high)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Requirements</h2>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {company.requirements.map((r: string, i: number) => (
                  <li key={i} style={{ color: 'var(--text-low)', fontSize: '0.9rem', lineHeight: 1.5 }}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Benefits */}
          {company.benefits?.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.8125rem', color: 'var(--text-high)', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Perks & Benefits</h3>
              {company.benefits.map((b: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', borderBottom: i < company.benefits.length - 1 ? '1px solid var(--surface-highest)' : 'none' }}>
                  <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-low)' }}>{b}</span>
                </div>
              ))}
            </div>
          )}

          {/* Past Packages */}
          {company.pastPackages?.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.8125rem', color: 'var(--text-high)', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Past Packages</h3>
              {company.pastPackages.map((p: string, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: i < company.pastPackages.length - 1 ? '1px solid var(--surface-highest)' : 'none' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-low)' }}>{p}</span>
                </div>
              ))}
            </div>
          )}

          {/* Apply again CTA */}
          <Button
            variant="primary"
            fullWidth
            leftIcon={<CheckCircle size={15} />}
            onClick={() => applyMutation.mutate()}
            disabled={hasApplied || applyMutation.isPending}
          >
            {applyMutation.isPending ? 'Applying...' : hasApplied ? (statusLabel[company.myStatus] ?? '✓ Applied') : 'Apply for this Drive'}
          </Button>
        </div>
      </div>
    </div>
  );
};
