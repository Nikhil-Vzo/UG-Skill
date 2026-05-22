import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase, MapPin, Clock, Video, Calendar, Filter,
  CheckCircle, XCircle, AlertCircle, Search, Loader2, ExternalLink,
  Building2, ChevronRight, LayoutGrid, List, Sparkles,
  Target, Award, Users, ArrowRight, Star, Zap, ListOrdered,
  Radio, PlayCircle, Trophy, AlertTriangle, TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/loaders/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import api from '../lib/api';
import './PlacementsHub.css';
import { InterviewBanner } from '../components/features/placements/InterviewBanner';
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

function daysUntil(d?: string): number | null {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}


/* ─────────── Drive Card ─────────── */
const DriveCard: React.FC<{ drive: Drive; onApply: () => void; onClick: () => void; isApplying: boolean }> = ({ drive, onClick, onApply, isApplying }) => {
  const cfg = STATUS_CONFIG[drive.status] ?? STATUS_CONFIG.open;
  const { name: companyName, initial } = resolveCompany(drive);
  const color = logoColor(companyName);
  const canApply = drive.status === 'active' || drive.status === 'open';
  const days = daysUntil(drive.registrationDeadline);
  const deadlineUrgent = days !== null && days <= 3 && days >= 0;

  return (
    <div
      className="drive-card-pro surface-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      {/* Top */}
      <div className="drive-card-top">
        <div className="drive-company">
          <div className="drive-logo" style={{ background: color }}>{initial}</div>
          <div className="drive-company-copy">
            <div className="drive-company-name">{companyName}</div>
            <div className="drive-name">{drive.name}</div>
            <div className="drive-roles">{drive.targetRoles?.join(' · ') || 'Roles TBA'}</div>
          </div>
        </div>
        <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
      </div>

      {/* Meta grid */}
      <div className="drive-meta-grid">
        <div className="drive-meta-item">
          <MapPin size={13} />
          <span>{drive.location || 'TBA'}</span>
        </div>
        <div className="drive-meta-item">
          <Briefcase size={13} />
          <span>{drive.package || 'Package TBA'}</span>
        </div>
        <div className={`drive-meta-item ${deadlineUrgent ? 'drive-meta-item--urgent' : ''}`}>
          <Clock size={13} />
          <span>
            {drive.registrationDeadline
              ? deadlineUrgent
                ? days === 0 ? 'Last day!' : `${days}d left`
                : `By ${formatDeadline(drive.registrationDeadline)}`
              : 'Deadline TBA'}
          </span>
        </div>
      </div>

      {/* Eligibility */}
      {(drive.cgpaCutoff ?? 0) > 0 && (
        <div className="drive-eligibility">
          <Trophy size={12} />
          <span>CGPA ≥ {drive.cgpaCutoff}</span>
          {(drive.branches ?? []).length > 0 && (
            <>
              <span className="drive-eligibility__dot">·</span>
              <span>{(drive.branches ?? []).slice(0, 2).join(', ')}{(drive.branches ?? []).length > 2 ? ` +${(drive.branches ?? []).length - 2}` : ''}</span>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="drive-card-actions">
        <button className="drive-details-btn" type="button" onClick={e => { e.stopPropagation(); onClick(); }}>
          Details <ChevronRight size={13} />
        </button>
        {canApply && (
          <button
            onClick={e => { e.stopPropagation(); onApply(); }}
            disabled={isApplying}
            className="drive-apply-btn"
          >
            {isApplying ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {isApplying ? 'Applying…' : 'Quick Apply'}
          </button>
        )}
        {drive.status === 'selected' && (
          <span className="drive-selected-chip"><Trophy size={12} /> Offer Received</span>
        )}
      </div>
    </div>
  );
};

/* ─────────── Kanban Column ─────────── */
const KanbanCol: React.FC<{ title: string; count: number; children: React.ReactNode; accent: string }> = ({ title, count, children, accent }) => (
  <div className="kanban-col">
    <div className="kanban-col__header" style={{ borderBottomColor: accent }}>
      <span className="kanban-col__title">{title}</span>
      <span className="kanban-col__badge" style={{ background: accent }}>{count}</span>
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

/* ─────────── History Card ─────────── */
const HistoryRow: React.FC<{ session: InterviewSession }> = ({ session }) => (
  <div className="history-row">
    <div className="history-row__logo" style={{ background: logoColor(session.companyName ?? 'X') }}>
      {(session.companyName ?? 'X')[0].toUpperCase()}
    </div>
    <div className="history-row__body">
      <div className="history-row__company">{session.companyName ?? 'Interview'}</div>
      <div className="history-row__meta">
        {session.driveName ?? 'Placement Drive'} · Round {session.roundNumber || 1}
        {session.createdAt ? ` · ${new Date(session.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}` : ''}
      </div>
    </div>
    <span className="history-row__status">
      <CheckCircle size={13} /> Completed
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 400);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const { user } = useAuthStore();

  /* ── Data fetching ── */
  const { data: mySessions = [] } = useQuery<InterviewSession[]>({
    queryKey: ['my-interview-sessions', user?.id],
    queryFn: async () => {
      const res = await api.get('/placements/sessions?studentId=me&active=true');
      return res.data.data || res.data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  const { data: completedSessions = [] } = useQuery<InterviewSession[]>({
    queryKey: ['my-completed-interview-sessions', user?.id],
    queryFn: async () => {
      const res = await api.get('/placements/sessions?studentId=me&status=completed');
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
      queryClient.invalidateQueries({ queryKey: ['placement-drives-db'] });
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

  /* ── Render ── */
  return (
    <div className="placements-page">

      {/* ── Interview Banners (above everything) ── */}
      <InterviewBanner sessions={mySessions} onJoin={handleJoin} />

      {/* ── Header ── */}
      <div className="placements-header">
        <div className="placements-title-section">
          <div className="placements-badge"><Sparkles size={13} /> Career Launchpad</div>
          <h1 className="placements-title">Placement Hub</h1>
          <p className="placements-subtitle">Discover drives, track applications, and ace your interviews</p>
        </div>
        <div className="placements-view-toggle">
          {(['grid', 'kanban', 'timeline'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`view-btn ${view === v ? 'active' : ''}`} title={v}>
              {v === 'grid' ? <LayoutGrid size={15} /> : v === 'kanban' ? <List size={15} /> : <ListOrdered size={15} />}
              <span>{v.charAt(0).toUpperCase() + v.slice(1)}</span>
            </button>
          ))}
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
            { label: 'Open Drives', val: openDrives.length, icon: <Zap size={17} />, color: 'var(--success)', trend: `${filtered.length} match your filters` },
            { label: 'Applications', val: myApps.length, icon: <Briefcase size={17} />, color: 'var(--primary)', trend: `${myApps.filter(d => d.status === 'applied').length} under review` },
            { label: 'Pipeline', val: shortlistedCount, icon: <Star size={17} />, color: 'var(--warning)', trend: 'Shortlist + interview stages' },
            { label: 'Offer Rate', val: `${Math.round((myApps.filter(d => d.status === 'selected').length / Math.max(myApps.length, 1)) * 100)}%`, icon: <Target size={17} />, color: 'var(--color-info)', trend: 'Offers from applications' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ '--accent-color': s.color } as React.CSSProperties}>
              <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-trend">{s.trend}</div>
            </div>
          ))
        )}
      </div>

      {/* ── Interview History ── */}
      {completedSessions.length > 0 && (
        <div className="history-section">
          <div className="history-section__header">
            <Trophy size={16} />
            <span>Interview History</span>
            <span className="history-section__count">{completedSessions.length}</span>
          </div>
          <div className="history-list">
            {completedSessions.slice(0, 4).map(s => <HistoryRow key={s.id} session={s} />)}
            {completedSessions.length > 4 && (
              <button className="history-see-more">
                See {completedSessions.length - 4} more <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Filters Row ── */}
      <div className="placements-filters">
        <div className="search-well">
          <Search className="search-icon" size={15} />
          <input
            type="text"
            placeholder="Search companies, roles…"
            className="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <button className={`filter-toggle ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
          <Filter size={15} /> Filters {showFilters ? '▲' : '▼'}
        </button>
        <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
          <option value="deadline">Sort: Deadline</option>
          <option value="package">Sort: Package</option>
          <option value="company">Sort: Company A–Z</option>
        </select>
        {isLoading && <Loader2 size={17} className="loading-spinner" />}
      </div>

      {/* ── Filter Panel ── */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-pills">
              {(['all', 'open', 'applied', 'shortlisted', 'rejected', 'selected'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`filter-pill ${filter === f ? 'active' : ''}`}>
                  {f === 'all' ? 'All' : STATUS_CONFIG[f as DriveStatus]?.label ?? f}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Role</label>
            <select className="role-select" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
              {availableRoles.map(role => <option key={role} value={role}>{role === 'all' ? 'All Roles' : role}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Eligibility · CGPA {user?.cgpa ?? 'N/A'}</label>
            <label className="cgpa-toggle">
              <input type="checkbox" checked={eligibleOnly} onChange={e => setEligibleOnly(e.target.checked)} />
              <span className="cgpa-toggle__track" />
              <span className="cgpa-toggle__label">Eligible drives only</span>
            </label>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {isError && (
        <div className="placements-error">
          <AlertTriangle size={17} /> Failed to load placement drives. Check the API server is running.
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
                  <h2 className="placements-empty-title">No matching drives</h2>
                  <p className="placements-empty-text">Try adjusting your search, filters, or eligibility toggle.</p>
                  <button className="placements-empty-reset" onClick={() => { setSearch(''); setFilter('all'); setSelectedRole('all'); setEligibleOnly(false); }}>
                    Reset all filters
                  </button>
                </div>
              )
              : filtered.map(d => (
                <DriveCard
                  key={d.id}
                  drive={d}
                  onClick={() => navigate(`/app/placements/${d.id}`)}
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
                  ? <div className="kanban-empty">No drives here yet</div>
                  : col.map(d => (
                    <DriveCard
                      key={d.id}
                      drive={d}
                      onClick={() => navigate(`/app/placements/${d.id}`)}
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
              <h2 className="placements-empty-title">No active applications yet</h2>
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
                <div key={d.id} className="timeline-card surface-card">
                  <div className="timeline-card__header">
                    <div className="timeline-card__company">
                      <div className="timeline-card__logo" style={{ background: logoColor(cName) }}>{initial}</div>
                      <div>
                        <div className="timeline-card__name">{cName}</div>
                        <div className="timeline-card__drive">{d.name}</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/app/placements/${d.id}`)}>Details</Button>
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
                          <div className={`timeline-step__label ${done || fail ? 'active' : ''}`}>
                            {fail ? 'Rejected' : stage.charAt(0).toUpperCase() + stage.slice(1)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
