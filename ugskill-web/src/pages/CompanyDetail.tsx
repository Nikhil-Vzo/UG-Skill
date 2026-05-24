import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Briefcase, Users, Clock,
  CheckCircle, AlertCircle, Loader2,
  ChevronDown, ChevronUp, Code2, MessageSquare, Plus, Trophy
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/loaders/Skeleton';
import { ResumeDropzone } from '../components/features/placements/ResumeDropzone';
import api from '../lib/api';
import './PlacementsHub.css'; // Leverage placements styling

const ROUND_ICONS: Record<string, React.ReactNode> = {
  coding: <Code2 size={14} />,
  interview: <MessageSquare size={14} />,
  hr: <Users size={14} />,
};

const LOGO_PALETTE = ['#4285F4', '#00A4EF', '#F7CB45', '#FF9900', '#2D9CDB', '#76B900', '#E91E63', '#9C27B0'];
function logoColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return LOGO_PALETTE[Math.abs(hash) % LOGO_PALETTE.length];
}

/* ─────────── Component ─────────── */
export const CompanyDetail: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedRound, setExpandedRound] = useState<string | null>(null);

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['drive', driveId],
    queryFn: async () => {
      const res = await api.get(`/placements/drives/${driveId}`);
      return res.data.data ?? res.data;
    },
    enabled: !!driveId,
  });

  const applyMutation = useMutation({
    mutationFn: () => api.post('/placements/registrations', { driveId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drive', driveId] });
      queryClient.invalidateQueries({ queryKey: ['placement-drives'] });
    },
  });

  const hasApplied = company?.myStatus && company.myStatus !== 'none';
  const statusLabel: Record<string, string> = {
    applied: 'Application Submitted',
    shortlisted: 'Shortlisted for Next Round',
    rejected: 'Application Not Selected',
    selected: 'Offer Received!',
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
      <div className="placements-page" style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
        <button onClick={() => navigate('/app/placements')} className="font-mono text-[10px] tracking-widest uppercase flex items-center gap-1 bg-none border-none text-slate-400 cursor-pointer mb-8">
          <ArrowLeft size={14} /> Back to Hub
        </button>
        <div className="drive-detail-error font-mono text-xs">
          <AlertCircle size={20} className="inline mr-2" />
          <span>Failed to load drive details. The drive may not exist or is no longer available.</span>
        </div>
      </div>
    );
  }

  const { name: companyName } = company;
  const logoInitial = (company.companyName || company.name || '?').charAt(0).toUpperCase();
  const logoBg = logoColor(company.companyName || company.name || '');

  const rounds = company.flow?.rounds || company.flow?.stages || [];
  const requirements = company.requirements || [];
  const benefits = company.benefits || [];
  const pastPackages = company.pastPackages || [];

  return (
    <div className="placements-page" style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/app/placements')} 
        className="font-mono text-[10px] tracking-widest uppercase flex items-center gap-1 bg-transparent border-0 text-slate-400 cursor-pointer w-fit hover:text-indigo-400 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Hub
      </button>

      {/* Hero card as a folder preview */}
      <div className="company-detail-card timeline-card surface-card folder-preview folder-expanded">
        <div className="folder-tab">
          <span className="font-mono text-[9px] tracking-widest uppercase">
            SPECIFICATION DOCUMENT
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div 
            className="drive-logo font-serif" 
            style={{ 
              width: 72, 
              height: 72, 
              background: logoBg, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '2rem', 
              fontWeight: 900, 
              color: 'white', 
              flexShrink: 0,
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            {logoInitial}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <h1 className="font-serif text-2xl font-bold text-slate-100" style={{ margin: 0 }}>
                {company.companyName || company.name}
              </h1>
              <Badge variant={company.status === 'active' || company.status === 'open' ? 'success' : 'default'} size="sm">
                <span className="font-mono text-[9px] tracking-widest uppercase">
                  {company.status === 'active' || company.status === 'open' ? 'Hiring Open' : company.status}
                </span>
              </Badge>
            </div>
            <p className="font-serif text-slate-400 text-sm mb-4">{company.name}</p>
            
            <div className="drive-meta-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', background: 'transparent', border: 0, padding: 0 }}>
              {company.location && (
                <div className="drive-meta-item">
                  <MapPin size={13} className="text-indigo-400" />
                  <span className="font-mono text-[10px] tracking-wider">{company.location}</span>
                </div>
              )}
              {company.package && (
                <div className="drive-meta-item">
                  <Briefcase size={13} className="text-indigo-400" />
                  <span className="font-mono text-[10px] tracking-wider">{company.package}</span>
                </div>
              )}
              {company.targetRoles && (
                <div className="drive-meta-item">
                  <Users size={13} className="text-indigo-400" />
                  <span className="font-mono text-[10px] tracking-wider">{company.targetRoles.join(', ')}</span>
                </div>
              )}
              {company.registrationDeadline && (
                <div className="drive-meta-item">
                  <Clock size={13} className="text-indigo-400" />
                  <span className="font-mono text-[10px] tracking-wider">
                    Deadline: {new Date(company.registrationDeadline).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Eligibility pills */}
        {(company.branches?.length || company.cgpaCutoff) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', paddingTop: '1.25rem', marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span className="font-mono text-[9px] tracking-widest text-slate-500 uppercase">ELIGIBILITY:</span>
            {(company.branches ?? []).map((b: string) => (
              <Badge key={b} variant="outline" size="sm">
                <span className="font-mono text-[9px] tracking-wider">{b.toUpperCase()}</span>
              </Badge>
            ))}
            {company.cgpaCutoff && (
              <Badge variant="warning" size="sm">
                <span className="font-mono text-[9px] tracking-wider">CGPA ≥ {company.cgpaCutoff}</span>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Two-column spec layout */}
      <div className="drive-expanded-grid">
        {/* Left column */}
        <div className="drive-expanded-left">
          
          {/* Description */}
          {(company.companyDescription || company.description) && (
            <div className="drive-expanded-section">
              <h4 className="drive-expanded-h4 font-serif">About the Role</h4>
              <p className="drive-expanded-text">
                {company.companyDescription || company.description}
              </p>
            </div>
          )}

          {/* Requirements */}
          {requirements.length > 0 && (
            <div className="drive-expanded-section">
              <h4 className="drive-expanded-h4 font-serif">Requirements</h4>
              <ul className="drive-expanded-list">
                {requirements.map((req: string, i: number) => (
                  <li key={i} className="drive-expanded-li">
                    <span className="bullet font-mono text-indigo-400">►</span> {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Selection rounds */}
          {rounds.length > 0 && (
            <div className="drive-expanded-section">
              <h4 className="drive-expanded-h4 font-serif">Selection Process</h4>
              <div className="drive-rounds-accordion">
                {rounds.map((r: any, i: number) => {
                  const roundId = r.id ?? `round-${i}`;
                  const isRoundOpen = expandedRound === roundId;
                  return (
                    <div key={roundId} className="drive-round-item">
                      <button
                        type="button"
                        onClick={() => setExpandedRound(isRoundOpen ? null : roundId)}
                        className={`drive-round-trigger ${isRoundOpen ? 'active' : ''}`}
                      >
                        <div className="drive-round-trigger-left">
                          <span className="drive-round-icon-wrap">
                            {ROUND_ICONS[r.roundType] ?? <MessageSquare size={13} />}
                          </span>
                          <span className="drive-round-title font-mono text-xs font-semibold tracking-wider">
                            R{i + 1}: {r.roundType?.replace('_', ' ').toUpperCase()}
                          </span>
                          {r.duration && (
                            <span className="drive-round-duration font-mono text-[10px] text-slate-500">
                              ({r.duration})
                            </span>
                          )}
                        </div>
                        {isRoundOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {isRoundOpen && (
                        <div className="drive-round-collapse" style={{ padding: '0.875rem 1rem', background: 'rgba(255, 255, 255, 0.01)' }}>
                          <p className="drive-round-description" style={{ margin: 0 }}>
                            {r.description || 'Details regarding evaluation criteria will be briefed prior to the evaluation.'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="drive-expanded-right">
          
          {/* Benefits */}
          {benefits.length > 0 && (
            <div className="drive-expanded-section card-style">
              <h5 className="drive-expanded-h5 font-serif">Perks & Compensation</h5>
              <div className="drive-benefits-grid">
                {benefits.map((b: string, i: number) => (
                  <div key={i} className="drive-benefit-item font-mono text-[11px] tracking-wide">
                    <CheckCircle size={11} className="text-emerald-400 inline-block mr-1.5 flex-shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Packages / Analytics */}
          {pastPackages.length > 0 && (
            <div className="drive-expanded-section card-style">
              <h5 className="drive-expanded-h5 font-serif">Hiring Analytics</h5>
              <div className="drive-analytics-list">
                <div className="drive-analytics-header font-mono text-[9px] tracking-widest text-slate-500">
                  <span>HISTORICAL OFFERS</span>
                  <span>COMPENSATION</span>
                </div>
                {pastPackages.map((p: string, i: number) => (
                  <div key={i} className="drive-analytics-row font-mono text-[11px] tracking-wider">
                    <span className="text-slate-400">Past Batch Offer #{i + 1}</span>
                    <span className="text-indigo-400 font-bold">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resume Upload & Applying */}
          <div className="drive-expanded-section card-style accent">
            <h5 className="drive-expanded-h5 font-serif">Credentials Verification</h5>
            
            <ResumeDropzone className="mb-4" />

            <div className="pt-2">
              <Button
                variant="primary"
                fullWidth
                leftIcon={hasApplied ? <CheckCircle size={15} /> : <Plus size={15} />}
                onClick={() => applyMutation.mutate()}
                disabled={hasApplied || applyMutation.isPending}
              >
                {applyMutation.isPending ? 'Submitting Application...' : hasApplied ? (statusLabel[company.myStatus] ?? 'Application Submitted') : 'Submit Credentials & Apply'}
              </Button>
              
              {hasApplied && (
                <div className="text-center mt-2 font-mono text-[10px] tracking-widest text-emerald-400 uppercase">
                  Application Active • Review in Progress
                </div>
              )}
              {applyMutation.isError && (
                <div className="text-center mt-2 font-mono text-[10px] text-red-400 uppercase">
                  Submission failed. Try again.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
