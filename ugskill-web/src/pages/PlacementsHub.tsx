import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, MapPin, Clock, Video, Calendar, Filter,
  CheckCircle, XCircle, AlertCircle, Search, Loader2, ExternalLink,
  Building2, ChevronRight, LayoutGrid, List, Sparkles,
  Target, Award, Users, ArrowRight, Star, Zap, ListOrdered,
  Radio, PlayCircle, Trophy, AlertTriangle, TrendingUp, ChevronDown, ChevronUp, Code2, MessageSquare, Plus, FileText
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/loaders/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import api from '../lib/api';
import './PlacementsHub.css';
import { InterviewBanner } from '../components/features/placements/InterviewBanner';
import { ResumeDropzone } from '../components/features/placements/ResumeDropzone';
import type { InterviewSession } from '../components/features/placements/InterviewBanner';

/* ─────────── Types ─────────── */
type DriveStatus = 'open' | 'active' | 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'closed' | 'selected';

interface Drive {
  id: string;
  companyName: string;
  companyLogo?: string;
  name: string;
  targetRoles: string[];
  location?: string;
  package?: string;
  registrationDeadline?: string;
  status: DriveStatus;
  cgpaCutoff?: number;
  branches?: string[];
}

/* ─────────── Config ─────────── */
const STATUS_CONFIG: Record<DriveStatus, { label: string; variant: any }> = {
  open: { label: 'Open', variant: 'success' },
  active: { label: 'Open', variant: 'success' },
  applied: { label: 'Applied', variant: 'primary' },
  shortlisted: { label: 'Shortlisted', variant: 'warning' },
  interview: { label: 'Interviewing', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'danger' },
  closed: { label: 'Closed', variant: 'default' },
  selected: { label: 'Selected ✓', variant: 'success' },
};

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

function resolveCompany(drive: Drive): { name: string; initial: string } {
  const name = drive.companyName || drive.name || 'Unknown';
  return { name, initial: name[0]?.toUpperCase() ?? 'U' };
}

function formatDeadline(d?: string): string {
  if (!d) return 'N/A';
  try { return new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' }); } catch { return d; }
}

// Format date relative or locale for historical records
const formatFullDate = (d?: string): string => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return d; }
};

function daysUntil(d?: string): number | null {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

/* ─────────── Details In-Place Component ─────────── */
const DriveDetailsInPlace: React.FC<{ driveId: string; onApplyFinished: () => void }> = ({ driveId, onApplyFinished }) => {
  const [expandedRound, setExpandedRound] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['drive-detail-inplace', driveId],
    queryFn: async () => {
      const res = await api.get(`/placements/drives/${driveId}`);
      return res.data.data ?? res.data;
    },
    enabled: !!driveId,
  });

  const applyMutation = useMutation({
    mutationFn: () => api.post('/placements/registrations', { driveId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drive-detail-inplace', driveId] });
      queryClient.invalidateQueries({ queryKey: ['placement-drives'] });
      onApplyFinished();
    },
    onError: (err: any) => {
      // Surface the actual API error message (CGPA cutoff, no resume, etc.)
      console.error('Apply error:', err?.response?.data);
    },
  });

  if (isLoading) {
    return (
      <div className="drive-detail-loading font-mono text-xs tracking-wider uppercase text-indigo-400">
        <Loader2 className="spinner inline-block mr-2" size={14} /> Loading drive specifications...
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="drive-detail-error font-mono text-xs text-red-400">
        <AlertCircle className="inline-block mr-2" size={14} /> Spec loading failed. Drive may be closed.
      </div>
    );
  }

  const hasApplied = company.myStatus && company.myStatus !== 'none';
  const statusLabel: Record<string, string> = {
    applied: 'Application Submitted',
    shortlisted: 'Shortlisted for Next Round',
    rejected: 'Application Not Selected',
    selected: 'Offer Received!',
  };

  const rounds = company.flow?.rounds || company.flow?.stages || [];
  const requirements = company.requirements || [];
  const benefits = company.benefits || [];
  const pastPackages = company.pastPackages || [];

  return (
    <div className="drive-expanded-content">
      {/* Overview Grid */}
      <div className="drive-expanded-grid">
        {/* Left Column: Specs */}
        <div className="drive-expanded-left">
          {/* About */}
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

          {/* Selection Rounds */}
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
                      <AnimatePresence>
                        {isRoundOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                            className="drive-round-collapse"
                          >
                            <p className="drive-round-description">
                              {r.description || 'Details regarding evaluation criteria will be briefed prior to the evaluation.'}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Upload & Secondary Meta */}
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

          {/* Past Packages (Analytics) */}
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

          {/* Resume Dropzone & CTA */}
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
                  {(applyMutation.error as any)?.response?.data?.error?.message ||
                   (applyMutation.error as any)?.message ||
                   'Submission failed. Please try again.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────── Drive Card ─────────── */
const DriveCard: React.FC<{
  drive: Drive;
  onApply: () => void;
  isApplying: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ drive, onApply, isApplying, isExpanded, onToggleExpand }) => {
  const cfg = STATUS_CONFIG[drive.status] ?? STATUS_CONFIG.open;
  const { name: companyName, initial } = resolveCompany(drive);
  const color = logoColor(companyName);
  const canApply = drive.status === 'active' || drive.status === 'open';
  const days = daysUntil(drive.registrationDeadline);
  const deadlineUrgent = days !== null && days <= 3 && days >= 0;

  return (
    <div
      className={`drive-card-pro folder-preview ${isExpanded ? 'folder-expanded' : ''}`}
      onClick={onToggleExpand}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onToggleExpand()}
    >
      {/* Folder Tab Effect */}
      <div className="folder-tab">
        <span className="font-mono text-[9px] tracking-widest uppercase">
          REF: #{drive.id.substring(0, 5)}
        </span>
      </div>

      <div className="drive-card-inner">
        {/* Top */}
        <div className="drive-card-top">
          <div className="drive-company">
            <div className="drive-logo font-serif" style={{ background: color }}>{initial}</div>
            <div className="drive-company-copy">
              <h3 className="drive-company-name font-serif">{companyName}</h3>
              <div className="drive-name">{drive.name}</div>
              <div className="drive-roles font-mono text-[10px] tracking-wider uppercase">
                {drive.targetRoles?.join(' · ') || 'Roles TBA'}
              </div>
            </div>
          </div>
          <Badge variant={cfg.variant} size="sm">
            <span className="font-mono text-[10px] tracking-widest uppercase">{cfg.label}</span>
          </Badge>
        </div>

        {/* Meta grid */}
        <div className="drive-meta-grid">
          <div className="drive-meta-item">
            <MapPin size={12} className="text-indigo-400" />
            <span className="font-mono text-[10px] tracking-wider">{drive.location || 'TBA'}</span>
          </div>
          <div className="drive-meta-item">
            <Briefcase size={12} className="text-indigo-400" />
            <span className="font-mono text-[10px] tracking-wider">{drive.package || 'Package TBA'}</span>
          </div>
          <div className={`drive-meta-item ${deadlineUrgent ? 'drive-meta-item--urgent' : ''}`}>
            <Clock size={12} className={deadlineUrgent ? 'text-red-400' : 'text-indigo-400'} />
            <span className="font-mono text-[10px] tracking-wider">
              {drive.registrationDeadline
                ? deadlineUrgent
                  ? days === 0 ? 'Last day!' : `${days}d left`
                  : `${formatDeadline(drive.registrationDeadline)}`
                : 'Deadline TBA'}
            </span>
          </div>
        </div>

        {/* Eligibility */}
        {(drive.cgpaCutoff ?? 0) > 0 && (
          <div className="drive-eligibility font-mono text-[10px] tracking-wider">
            <Trophy size={11} className="text-amber-400" />
            <span>CGPA CUTOFF: {drive.cgpaCutoff}</span>
            {(drive.branches ?? []).length > 0 && (
              <>
                <span className="drive-eligibility__dot">·</span>
                <span>
                  {(drive.branches ?? []).slice(0, 2).join(', ').toUpperCase()}
                  {(drive.branches ?? []).length > 2 ? ` +${(drive.branches ?? []).length - 2}` : ''}
                </span>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="drive-card-actions">
          <button 
            className={`drive-details-btn font-mono text-[10px] tracking-widest uppercase ${isExpanded ? 'active' : ''}`} 
            type="button" 
            onClick={e => { e.stopPropagation(); onToggleExpand(); }}
          >
            <span>{isExpanded ? 'Collapse Spec' : 'Expand Spec'}</span>
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          {canApply && !isExpanded && (
            <button
              onClick={e => { e.stopPropagation(); onApply(); }}
              disabled={isApplying}
              className="drive-apply-btn font-mono text-[10px] tracking-widest uppercase"
            >
              {isApplying ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {isApplying ? 'Applying…' : 'Quick Apply'}
            </button>
          )}
          
          {drive.status === 'selected' && (
            <span className="drive-selected-chip font-mono text-[10px] tracking-widest uppercase">
              <Trophy size={11} /> Offer Received
            </span>
          )}
        </div>

        {/* Expandable Details Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 20 }}
              style={{ overflow: 'hidden' }}
              onClick={e => e.stopPropagation()} // Prevent closing on detail interaction
            >
              <DriveDetailsInPlace 
                driveId={drive.id} 
                onApplyFinished={() => {
                  // Additional apply success triggers can be wired here
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─────────── Kanban Column ─────────── */
const KanbanCol: React.FC<{ title: string; count: number; children: React.ReactNode; accent: string }> = ({ title, count, children, accent }) => (
  <div className="kanban-col">
    <div className="kanban-col__header" style={{ borderBottomColor: accent }}>
      <span className="kanban-col__title font-mono text-[10px] tracking-widest">{title}</span>
      <span className="kanban-col__badge font-mono" style={{ background: accent }}>{count}</span>
    </div>
    <div className="kanban-col__body">{children}</div>
  </div>
);

/* ─────────── Drive Skeleton ─────────── */
const DriveSkeleton: React.FC = () => (
  <div className="surface-card drive-skeleton">
    <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
      <Skeleton variant="rectangular" width={44} height={44} />
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" height="18px" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="text" width="95%" />
  </div>
);

/* ─────────── History Row ─────────── */
const HistoryRow: React.FC<{ session: InterviewSession }> = ({ session }) => (
  <div className="history-row">
    <div className="history-row__logo font-serif" style={{ background: logoColor(session.companyName ?? 'X') }}>
      {(session.companyName ?? 'X')[0].toUpperCase()}
    </div>
    <div className="history-row__body">
      <div className="history-row__company font-serif">{session.companyName ?? 'Interview'}</div>
      <div className="history-row__meta font-mono text-[10px] tracking-wider uppercase text-slate-500">
        {session.driveName ?? 'Placement Drive'} · ROUND {session.roundNumber || 1}
        {session.createdAt ? ` · ${formatFullDate(session.createdAt)}` : ''}
      </div>
    </div>
    <span className="history-row__status font-mono text-[10px] tracking-widest uppercase">
      <CheckCircle size={12} /> Completed
    </span>
  </div>
);

/* ─────────── Main Page ─────────── */
export const PlacementsHub: React.FC = () => {
  const [view, setView] = useState<'grid' | 'kanban' | 'timeline'>('grid');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | DriveStatus>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'package' | 'company'>('deadline');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [eligibleOnly, setEligibleOnly] = useState(true);
  const [expandedDriveId, setExpandedDriveId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 400);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const { user } = useAuthStore();

  /* ── Data fetching ── */
  const { data: mySessions = [] } = useQuery<InterviewSession[]>({
    queryKey: ['my-interview-sessions', user?.id],
    queryFn: async () => {
      const res = await api.get('/placements/sessions?studentId=me&active=true&sessionType=live_interview');
      return res.data.data || res.data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  const { data: completedSessions = [] } = useQuery<InterviewSession[]>({
    queryKey: ['my-completed-interview-sessions', user?.id],
    queryFn: async () => {
      const res = await api.get('/placements/sessions?studentId=me&status=completed&sessionType=live_interview');
      return res.data.data || res.data || [];
    },
    enabled: !!user?.id,
  });

  const { data: drives = [], isLoading, isError } = useQuery<Drive[]>({
    queryKey: ['placement-drives'],
    queryFn: async () => {
      const res = await api.get('/placements/drives');
      return res.data.data?.drives ?? res.data.data ?? res.data ?? [];
    },
    staleTime: 60_000,
  });

  /* ── Derived data ── */
  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    drives.forEach(d => d.targetRoles?.forEach(r => roles.add(r)));
    return ['all', ...Array.from(roles)];
  }, [drives]);

  const applyMut = useMutation({
    mutationFn: (driveId: string) => api.post('/placements/registrations', { driveId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement-drives'] });
      setApplyingId(null);
    },
    onError: () => setApplyingId(null),
  });

  const filtered = useMemo(() => {
    let result = drives.filter(d => {
      const { name: cName } = resolveCompany(d);
      const q = debouncedSearch.toLowerCase();
      const matchSearch = cName.toLowerCase().includes(q) || d.name.toLowerCase().includes(q);
      const normalStatus = d.status === 'active' ? 'open' : d.status;
      const matchFilter = filter === 'all' || normalStatus === filter;
      const matchRole = selectedRole === 'all' || d.targetRoles?.includes(selectedRole);
      const matchCGPA = !eligibleOnly || !d.cgpaCutoff || d.cgpaCutoff <= (user?.cgpa || 10);
      return matchSearch && matchFilter && matchRole && matchCGPA;
    });
    switch (sortBy) {
      case 'deadline':
        result = result.sort((a, b) => {
          const aD = a.registrationDeadline ? new Date(a.registrationDeadline).getTime() : Infinity;
          const bD = b.registrationDeadline ? new Date(b.registrationDeadline).getTime() : Infinity;
          return aD - bD;
        }); break;
      case 'package':
        result = result.sort((a, b) => parseFloat(b.package?.replace(/[^0-9.]/g, '') || '0') - parseFloat(a.package?.replace(/[^0-9.]/g, '') || '0'));
        break;
      case 'company':
        result = result.sort((a, b) => resolveCompany(a).name.localeCompare(resolveCompany(b).name));
        break;
    }
    return result;
  }, [drives, debouncedSearch, filter, selectedRole, user?.cgpa, sortBy, eligibleOnly]);

  const myApps = drives.filter(d => ['applied', 'shortlisted', 'interview', 'selected', 'rejected'].includes(d.status));
  const openDrives = drives.filter(d => d.status === 'active' || d.status === 'open');
  const shortlistedCount = myApps.filter(d => ['shortlisted', 'interview', 'selected'].includes(d.status)).length;

  const handleApply = (driveId: string) => { setApplyingId(driveId); applyMut.mutate(driveId); };
  const handleJoin = (id: string) => navigate(`/app/placements/interview/${id}`);

  const handleToggleExpand = (driveId: string) => {
    setExpandedDriveId(prev => prev === driveId ? null : driveId);
  };

  /* ── Render ── */
  return (
    <div className="placements-page">

      {/* ── Interview Banners (above everything) ── */}
      <InterviewBanner sessions={mySessions} onJoin={handleJoin} />

      {/* ── Header ── */}
      <div className="placements-header">
        <div className="placements-title-section">
          <div className="placements-badge font-mono text-[9px] tracking-widest"><Sparkles size={11} /> Career Launchpad</div>
          <h1 className="placements-title font-serif">Placement Hub</h1>
          <p className="placements-subtitle">Discover drives, track applications, and ace your interviews</p>
        </div>
        <div className="placements-view-toggle">
          {(['grid', 'kanban', 'timeline'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`view-btn font-mono text-[10px] tracking-wider uppercase ${view === v ? 'active' : ''}`} title={v}>
              {v === 'grid' ? <LayoutGrid size={13} /> : v === 'kanban' ? <List size={13} /> : <ListOrdered size={13} />}
              <span>{v}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Global resume upload section for quick updates */}
      <div className="global-resume-section glass-panel">
        <div className="global-resume-header">
          <div className="global-resume-icon-wrap">
            <FileText size={18} className="text-indigo-400" />
          </div>
          <div className="global-resume-copy">
            <h3 className="global-resume-title font-serif">Active Career Credentials</h3>
            <p className="global-resume-description">
              Ensure your profile contains the latest resume version. Linked drives automatically reference this file.
            </p>
          </div>
        </div>
        <div className="global-resume-dropzone-wrap">
          <ResumeDropzone />
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="placements-stats">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card skeleton">
              <Skeleton variant="text" width="40%" height="32px" />
              <Skeleton variant="text" width="70%" />
            </div>
          ))
        ) : (
          [
            { label: 'Open Drives', val: openDrives.length, icon: <Zap size={15} />, color: 'var(--success)', trend: `${filtered.length} matching filters` },
            { label: 'Applications', val: myApps.length, icon: <Briefcase size={15} />, color: 'var(--primary)', trend: `${myApps.filter(d => d.status === 'applied').length} under review` },
            { label: 'Pipeline', val: shortlistedCount, icon: <Star size={15} />, color: 'var(--warning)', trend: 'Shortlist + interviews' },
            { label: 'Offer Rate', val: `${Math.round((myApps.filter(d => d.status === 'selected').length / Math.max(myApps.length, 1)) * 100)}%`, icon: <Target size={15} />, color: 'var(--color-info)', trend: 'Offers / Applications' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ '--accent-color': s.color } as React.CSSProperties}>
              <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="stat-value font-serif" style={{ color: s.color }}>{s.val}</div>
              <div className="stat-label font-mono text-[9px] tracking-widest">{s.label}</div>
              <div className="stat-trend font-mono text-[8px] tracking-wider">{s.trend}</div>
            </div>
          ))
        )}
      </div>

      {/* ── Interview History ── */}
      {completedSessions.length > 0 && (
        <div className="history-section">
          <div className="history-section__header">
            <Trophy size={14} className="text-amber-400" />
            <span className="font-mono text-[10px] tracking-widest">Interview History</span>
            <span className="history-section__count font-mono">{completedSessions.length}</span>
          </div>
          <div className="history-list">
            {completedSessions.slice(0, 4).map(s => <HistoryRow key={s.id} session={s} />)}
            {completedSessions.length > 4 && (
              <button className="history-see-more font-mono text-[10px] tracking-widest uppercase">
                See {completedSessions.length - 4} more <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Filters Row ── */}
      <div className="placements-filters">
        <div className="search-well">
          <Search className="search-icon" size={14} />
          <input
            type="text"
            placeholder="Search companies, roles…"
            className="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear font-mono" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <button className={`filter-toggle font-mono text-[10px] tracking-wider uppercase ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
          <Filter size={13} /> Filters {showFilters ? '▲' : '▼'}
        </button>
        <select className="sort-select font-mono text-[10px] tracking-wider" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
          <option value="deadline">SORT: DEADLINE</option>
          <option value="package">SORT: PACKAGE</option>
          <option value="company">SORT: COMPANY A–Z</option>
        </select>
        {isLoading && <Loader2 size={16} className="loading-spinner" />}
      </div>

      {/* ── Filter Panel ── */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label className="font-mono text-[9px] tracking-widest">Status</label>
            <div className="filter-pills">
              {(['all', 'open', 'applied', 'shortlisted', 'rejected', 'selected'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`filter-pill font-mono text-[10px] tracking-wider uppercase ${filter === f ? 'active' : ''}`}>
                  {f === 'all' ? 'All' : STATUS_CONFIG[f as DriveStatus]?.label ?? f}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label className="font-mono text-[9px] tracking-widest">Role</label>
            <select className="role-select font-mono text-[10px] tracking-wider" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
              {availableRoles.map(role => <option key={role} value={role}>{role === 'all' ? 'ALL ROLES' : role.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label className="font-mono text-[9px] tracking-widest">Eligibility · CGPA {user?.cgpa ?? 'N/A'}</label>
            <label className="cgpa-toggle">
              <input type="checkbox" checked={eligibleOnly} onChange={e => setEligibleOnly(e.target.checked)} />
              <span className="cgpa-toggle__track" />
              <span className="cgpa-toggle__label font-mono text-[10px] tracking-wider uppercase">Eligible drives only</span>
            </label>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {isError && (
        <div className="placements-error font-mono text-xs">
          <AlertTriangle size={15} /> Failed to sync placement drives. Verify API server status.
        </div>
      )}

      {/* ── Content ── */}
      {view === 'grid' ? (
        <div className="drives-grid">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <DriveSkeleton key={i} />)
            : filtered.length === 0
              ? (
                <div className="placements-empty">
                  <div className="placements-empty-icon"><Briefcase size={28} /></div>
                  <h2 className="placements-empty-title font-serif">No matching drives</h2>
                  <p className="placements-empty-text">Try adjusting your search, filters, or eligibility toggle.</p>
                  <button className="placements-empty-reset font-mono text-[11px] tracking-widest uppercase" onClick={() => { setSearch(''); setFilter('all'); setSelectedRole('all'); setEligibleOnly(false); }}>
                    Reset Filters
                  </button>
                </div>
              )
              : filtered.map(d => (
                <DriveCard
                  key={d.id}
                  drive={d}
                  isExpanded={expandedDriveId === d.id}
                  onToggleExpand={() => handleToggleExpand(d.id)}
                  onApply={() => handleApply(d.id)}
                  isApplying={applyingId === d.id}
                />
              ))
          }
        </div>
      ) : view === 'kanban' ? (
        <div className="kanban-board">
          {(['open', 'applied', 'shortlisted', 'rejected'] as const).map(s => {
            const accentMap = { open: 'var(--success)', applied: 'var(--primary-glow)', shortlisted: 'var(--warning)', rejected: 'var(--error)' };
            const titleMap = { open: 'Active Drives', applied: 'Applied', shortlisted: 'Shortlisted', rejected: 'Rejected' };
            const col = filtered.filter(d => d.status === s || (s === 'open' && d.status === 'active'));
            return (
              <KanbanCol key={s} title={titleMap[s]} count={col.length} accent={accentMap[s]}>
                {isLoading ? <DriveSkeleton /> : col.length === 0
                  ? <div className="kanban-empty font-mono text-xs">No entries</div>
                  : col.map(d => (
                    <DriveCard
                      key={d.id}
                      drive={d}
                      isExpanded={expandedDriveId === d.id}
                      onToggleExpand={() => handleToggleExpand(d.id)}
                      onApply={() => handleApply(d.id)}
                      isApplying={applyingId === d.id}
                    />
                  ))
                }
              </KanbanCol>
            );
          })}
        </div>
      ) : (
        /* Timeline */
        <div className="timeline-view">
          {isLoading ? (
            <DriveSkeleton />
          ) : myApps.length === 0 ? (
            <div className="placements-empty">
              <div className="placements-empty-icon"><TrendingUp size={28} /></div>
              <h2 className="placements-empty-title font-serif">No active applications</h2>
              <p className="placements-empty-text">Apply to a drive and track your progress here.</p>
            </div>
          ) : (
            myApps.map(d => {
              const stages = ['applied', 'shortlisted', 'interview', 'selected'];
              const isRejected = d.status === 'rejected';
              let idx = stages.indexOf(d.status);
              if (idx === -1 && !isRejected) idx = 0;
              const { name: cName, initial } = resolveCompany(d);

              return (
                <div key={d.id} className={`timeline-card surface-card folder-preview ${expandedDriveId === d.id ? 'folder-expanded' : ''}`}>
                  {/* Folder Tab Effect */}
                  <div className="folder-tab">
                    <span className="font-mono text-[9px] tracking-widest uppercase">
                      APP STAGE TRACKING
                    </span>
                  </div>

                  <div className="timeline-card__header">
                    <div className="timeline-card__company">
                      <div className="timeline-card__logo font-serif" style={{ background: logoColor(cName) }}>{initial}</div>
                      <div>
                        <div className="timeline-card__name font-serif">{cName}</div>
                        <div className="timeline-card__drive font-mono text-[10px] tracking-wider uppercase text-slate-500">{d.name}</div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleToggleExpand(d.id)}
                      className="font-mono text-[10px] tracking-widest uppercase"
                    >
                      {expandedDriveId === d.id ? 'Hide Details' : 'Details'}
                    </Button>
                  </div>

                  {/* Stepper */}
                  <div className="timeline-stepper">
                    <div className="timeline-stepper__track" />
                    <div
                      className="timeline-stepper__fill"
                      style={{
                        width: isRejected ? '100%' : `${(idx / (stages.length - 1)) * 100}%`,
                        background: isRejected ? 'var(--error)' : 'var(--primary)',
                      }}
                    />
                    {stages.map((stage, i) => {
                      const done = i <= idx && !isRejected;
                      const fail = isRejected && i === idx + 1;
                      const grayed = isRejected && i > idx + 1;
                      return (
                        <div key={stage} className="timeline-step">
                          <div className={`timeline-step__dot ${done ? 'done' : fail ? 'fail' : grayed ? 'gray' : ''}`}>
                            {done ? <CheckCircle size={14} /> : fail ? <XCircle size={14} /> : i + 1}
                          </div>
                          <div className={`timeline-step__label font-mono text-[9px] tracking-wider uppercase ${done || fail ? 'active' : ''}`}>
                            {fail ? 'Rejected' : stage}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* In-place expansion for timeline card as well! */}
                  <AnimatePresence>
                    {expandedDriveId === d.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                        style={{ overflow: 'hidden', width: '100%' }}
                      >
                        <div className="border-t border-slate-800/60 mt-4 pt-4">
                          <DriveDetailsInPlace 
                            driveId={d.id} 
                            onApplyFinished={() => {}}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
