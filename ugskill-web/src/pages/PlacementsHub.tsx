import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase, MapPin, Clock, Video, Calendar, TrendingUp, Filter,
  CheckCircle, XCircle, AlertCircle, Search, Loader2, MessageSquare, ExternalLink,
  Building2, DollarSign, GraduationCap, ChevronDown, LayoutGrid, List, Sparkles,
  Target, Award, Users, ArrowRight, Star, Zap, ListOrdered
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/loaders/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import api from '../lib/api';
import './PlacementsHub.css';

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
const STATUS_CONFIG: Record<DriveStatus, { label: string; variant: any; icon: React.ReactNode }> = {
  open: { label: 'Open', variant: 'success', icon: <Clock size={12} /> },
  active: { label: 'Open', variant: 'success', icon: <Clock size={12} /> },
  applied: { label: 'Applied', variant: 'primary', icon: <AlertCircle size={12} /> },
  shortlisted: { label: 'Shortlisted', variant: 'warning', icon: <CheckCircle size={12} /> },
  interview: { label: 'Interviewing', variant: 'warning', icon: <MessageSquare size={12} /> },
  rejected: { label: 'Rejected', variant: 'danger', icon: <XCircle size={12} /> },
  closed: { label: 'Closed', variant: 'default', icon: <XCircle size={12} /> },
  selected: { label: 'Selected', variant: 'success', icon: <CheckCircle size={12} /> },
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

/* ─────────── Drive Card ─────────── */
const DriveCard: React.FC<{ drive: Drive; onApply: () => void; onClick: () => void; isApplying: boolean }> = ({ drive, onClick, onApply, isApplying }) => {
  const cfg = STATUS_CONFIG[drive.status] ?? STATUS_CONFIG.open;
  const { name: companyName, initial } = resolveCompany(drive);
  const color = logoColor(companyName);
  const canApply = drive.status === 'active' || drive.status === 'open';
  return (
    <div
      className="surface-card drive-card-pro"
      onClick={onClick}
      style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.875rem', transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div className="drive-card-top">
        <div className="drive-company">
          <div className="drive-logo" style={{ background: color }}>
            {initial}
          </div>
          <div className="drive-company-copy">
            <div className="drive-company-name">{companyName}</div>
            <div className="drive-name">{drive.name}</div>
            <div className="drive-roles">{drive.targetRoles?.join(', ') || 'Role details pending'}</div>
          </div>
        </div>
        <Badge variant={cfg.variant} size="sm">{cfg.icon} {cfg.label}</Badge>
      </div>

      <div className="drive-meta-grid">
        <div className="drive-meta-item"><MapPin size={14} /><span>{drive.location || 'Location TBA'}</span></div>
        <div className="drive-meta-item"><Briefcase size={14} /><span>{drive.package || 'Package TBA'}</span></div>
        <div className="drive-meta-item"><Clock size={14} /><span>{drive.registrationDeadline ? `Apply by ${formatDeadline(drive.registrationDeadline)}` : 'Deadline TBA'}</span></div>
      </div>

      {(drive.cgpaCutoff ?? 0) > 0 && (
        <div className="drive-eligibility">
          <span style={{ color: 'var(--warning)' }}>CGPA ≥ {drive.cgpaCutoff}</span>
          {(drive.branches ?? []).length > 0 && (
            <><span>·</span><span>Branches: {(drive.branches ?? []).slice(0, 3).join(', ')}{(drive.branches ?? []).length > 3 ? ` +${(drive.branches ?? []).length - 3}` : ''}</span></>
          )}
        </div>
      )}

      <div className="drive-card-actions">
        <button className="drive-details-btn" type="button" onClick={e => { e.stopPropagation(); onClick(); }}>
          View details <ArrowRight size={14} />
        </button>
      {canApply && (
        <button
          onClick={e => { e.stopPropagation(); onApply(); }}
          disabled={isApplying}
          className="drive-apply-btn"
          style={{ alignSelf: 'flex-start', padding: '0.4rem 0.875rem', background: 'var(--primary-glow)', color: 'white', border: 'none', cursor: isApplying ? 'wait' : 'pointer', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          {isApplying ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          Apply
        </button>
      )}
      </div>
    </div>
  );
};

/* ─────────── Kanban Column ─────────── */
const KanbanCol: React.FC<{ title: string; count: number; children: React.ReactNode; accent: string }> = ({ title, count, children, accent }) => (
  <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${accent}` }}>
      <span style={{ color: 'var(--text-high)', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
      <span style={{ background: accent, color: 'white', borderRadius: '99px', padding: '0 0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>{count}</span>
    </div>
    {children}
  </div>
);

/* ─────────── Drive Skeleton ─────────── */
const DriveSkeleton: React.FC = () => (
  <div className="surface-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
    <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
      <Skeleton variant="rectangular" width={44} height={44} />
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" height="20px" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <Skeleton variant="text" width="80%" />
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


  const { data: mySessions = [] } = useQuery({
    queryKey: ['my-interview-sessions', user?.id],
    queryFn: async () => {
      const res = await api.get(`/placements/sessions?studentId=${user?.id}`);
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

  // Extract unique roles from drives
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
      const { name: companyName } = resolveCompany(d);
      const q = debouncedSearch.toLowerCase();
      const matchesSearch = companyName.toLowerCase().includes(q) || d.name.toLowerCase().includes(q);
      const normalizedStatus = d.status === 'active' ? 'open' : d.status;
      const matchesFilter = filter === 'all' || normalizedStatus === filter;
      const matchesRole = selectedRole === 'all' || d.targetRoles?.includes(selectedRole);
      const matchesCGPA = !eligibleOnly || !d.cgpaCutoff || d.cgpaCutoff <= (user?.cgpa || 10);
      return matchesSearch && matchesFilter && matchesRole && matchesCGPA;
    });

    // Apply sorting
    switch (sortBy) {
      case 'deadline':
        result = result.sort((a, b) => {
          const aDate = a.registrationDeadline ? new Date(a.registrationDeadline).getTime() : Infinity;
          const bDate = b.registrationDeadline ? new Date(b.registrationDeadline).getTime() : Infinity;
          return aDate - bDate;
        });
        break;
      case 'package':
        result = result.sort((a, b) => {
          const aPkg = parseFloat(a.package?.replace(/[^0-9.]/g, '') || '0');
          const bPkg = parseFloat(b.package?.replace(/[^0-9.]/g, '') || '0');
          return bPkg - aPkg;
        });
        break;
      case 'company':
        result = result.sort((a, b) => resolveCompany(a).name.localeCompare(resolveCompany(b).name));
        break;
    }
    return result;
  }, [drives, debouncedSearch, filter, selectedRole, user?.cgpa, sortBy, eligibleOnly]);

  const myApps = drives.filter(d => ['applied', 'shortlisted', 'interview', 'selected', 'rejected'].includes(d.status));
  const openDrives = drives.filter(d => d.status === 'active' || d.status === 'open');
  const shortlistedCount = myApps.filter(d => d.status === 'shortlisted' || d.status === 'interview' || d.status === 'selected').length;

  const statsConfig = [
    { label: 'Active Drives', val: openDrives.length, color: 'var(--success)' },
    { label: 'Applied', val: myApps.filter(d => d.status === 'applied').length, color: 'var(--primary-glow)' },
    { label: 'Shortlisted', val: shortlistedCount, color: 'var(--warning)' },
    { label: 'Rejected', val: myApps.filter(d => d.status === 'rejected').length, color: 'var(--error)' },
  ];

  const handleApply = (driveId: string) => {
    setApplyingId(driveId);
    applyMut.mutate(driveId);
  };

  return (
    <div className="placements-page">
      {/* Header */}
      <div className="placements-header">
        <div className="placements-title-section">
          <div className="placements-badge">
            <Sparkles size={14} /> Career Launchpad
          </div>
          <h1 className="placements-title">Placement Hub</h1>
          <p className="placements-subtitle">Discover opportunities, track applications, and launch your career</p>
        </div>
        <div className="placements-view-toggle">
          {(['grid', 'kanban', 'timeline'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`view-btn ${view === v ? 'active' : ''}`}
            >
              {v === 'grid' ? <LayoutGrid size={16} /> : v === 'kanban' ? <List size={16} /> : <ListOrdered size={16} />}
              <span>{v.charAt(0).toUpperCase() + v.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Stats Cards */}
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
            { label: 'Open Drives', val: openDrives.length, icon: <Zap size={18} />, color: 'var(--success)', trend: `${filtered.length} matching your filters` },
            { label: 'Applications', val: myApps.length, icon: <Briefcase size={18} />, color: 'var(--primary)', trend: `${myApps.filter(d => d.status === 'applied').length} under review` },
            { label: 'Pipeline', val: shortlistedCount, icon: <Star size={18} />, color: 'var(--warning)', trend: 'Shortlist and interview stages' },
            { label: 'Offer Rate', val: `${Math.round((myApps.filter(d => d.status === 'selected').length / Math.max(myApps.length, 1)) * 100)}%`, icon: <Target size={18} />, color: 'var(--color-info)', trend: 'Selected from applications' },
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

      {/* ── My Interviews Section ── */}
      {mySessions.length > 0 && (
        <div style={{ background: 'var(--surface-well)', border: '1px solid var(--primary-glow)', borderRadius: 16, padding: '1.5rem', marginTop: '1rem', boxShadow: '0 8px 32px rgba(20,184,166,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
            <Video size={20} />
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>My Interviews</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {mySessions.map((session: any) => (
              <div key={session.id} style={{ background: 'var(--surface-highest)', border: '1px solid var(--surface-highest)', borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-high)' }}>Round {session.roundNumber || 1} Interview</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-low)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                      <Calendar size={12} /> {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'Today'}
                    </div>
                  </div>
                  <Badge variant={session.status === 'scheduled' ? 'warning' : session.status === 'in_progress' ? 'success' : 'default'}>
                    {session.status?.replace('_', ' ')}
                  </Badge>
                </div>
                {(session.status === 'scheduled' || session.status === 'in_progress') && (
                  <button
                    onClick={() => navigate(`/app/placements/interview/${session.id}`)}
                    style={{ background: 'linear-gradient(135deg,var(--primary),var(--primary-hover))', color: '#fff', border: 'none', padding: '0.625rem', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}
                  >
                    <ExternalLink size={16} /> Join Interview
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="placements-filters">
        <div className="search-well" style={{ flex: 1, minWidth: 240 }}>
          <Search className="search-icon" size={16} />
          <input type="text" placeholder="Search companies, roles..." className="search-input" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        
        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} /> Filters
        </button>
        
        <select 
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="deadline">Sort by Deadline</option>
          <option value="package">Sort by Package</option>
          <option value="company">Sort by Company</option>
        </select>
        
        {isLoading && <Loader2 size={18} className="loading-spinner" />}
      </div>
      
      {/* Expandable Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-pills">
              {(['all', 'open', 'applied', 'shortlisted', 'rejected', 'selected'] as const).map(f => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)}
                  className={`filter-pill ${filter === f ? 'active' : ''}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          <div className="filter-group">
            <label>Role</label>
            <select 
              className="role-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : role}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Your CGPA: {user?.cgpa || 'N/A'}</label>
            <div className="cgpa-indicator">
              <span>Eligible drives only</span>
              <input 
                type="checkbox" 
                checked={eligibleOnly}
                onChange={(e) => setEligibleOnly(e.target.checked)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', padding: '1rem', background: 'var(--error-container)' }}>
          <AlertCircle size={18} /> Failed to load placement drives. Ensure the API server is running.
        </div>
      )}

      {/* Content */}
      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <DriveSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="placements-empty" style={{ gridColumn: '1/-1' }}>
              <div className="placements-empty-icon"><Briefcase size={28} /></div>
              <h2 className="placements-empty-title">No matching drives</h2>
              <p className="placements-empty-text">Adjust search, filters, or eligibility to see more opportunities.</p>
            </div>
          ) : (
            filtered.map(d => (
              <DriveCard
                key={d.id}
                drive={d}
                onClick={() => navigate(`/app/placements/${d.id}`)}
                onApply={() => handleApply(d.id)}
                isApplying={applyingId === d.id}
              />
            ))
          )}
        </div>
      ) : view === 'kanban' ? (
        <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {(['open', 'applied', 'shortlisted', 'rejected'] as const).map(s => {
            const accentMap: Record<string, string> = {
              open: 'var(--success)', applied: 'var(--primary-glow)', shortlisted: 'var(--warning)', rejected: 'var(--error)'
            };
            const title: Record<string, string> = { open: 'Active Drives', applied: 'Applied', shortlisted: 'Shortlisted', rejected: 'Rejected' };
            const col = filtered.filter(d => d.status === s);
            return (
              <KanbanCol key={s} title={title[s]} count={col.length} accent={accentMap[s]}>
                {isLoading ? <DriveSkeleton /> : col.map(d => (
                  <DriveCard
                    key={d.id}
                    drive={d}
                    onClick={() => navigate(`/app/placements/${d.id}`)}
                    onApply={() => handleApply(d.id)}
                    isApplying={applyingId === d.id}
                  />
                ))}
              </KanbanCol>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 800, margin: '0 auto' }}>
          {isLoading ? (
            <DriveSkeleton />
          ) : myApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-lowest)' }}>
              No applications to track yet.
            </div>
          ) : (
            myApps.map(d => {
              const stages = ['applied', 'shortlisted', 'interview', 'selected'];
              const isRejected = d.status === 'rejected';
              let currentStageIdx = stages.indexOf(d.status);
              if (currentStageIdx === -1 && !isRejected) currentStageIdx = 0; // fallback
              
              const { name: companyName, initial } = resolveCompany(d);
              
              return (
                <div key={d.id} className="surface-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 48, height: 48, background: logoColor(companyName), borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
                        {initial}
                      </div>
                      <div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-high)' }}>{companyName}</div>
                        <div style={{ color: 'var(--text-low)', fontSize: '0.875rem' }}>{d.name}</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/app/placements/${d.id}`)}>View Details</Button>
                  </div>
                  
                  {/* Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', marginTop: '0.5rem' }}>
                    <div style={{ position: 'absolute', top: 16, left: 30, right: 30, height: 2, background: 'var(--border)', zIndex: 0 }} />
                    <div style={{ position: 'absolute', top: 16, left: 30, right: 30, height: 2, background: isRejected ? 'var(--error)' : 'var(--primary)', zIndex: 0, width: isRejected ? '100%' : `${(currentStageIdx / (stages.length - 1)) * 100}%`, transition: 'width 0.5s ease' }} />
                    
                    {stages.map((stage, idx) => {
                      const isActive = idx <= currentStageIdx;
                      const isFailStage = isRejected && idx > currentStageIdx;
                      const isCurrentFail = isRejected && idx === currentStageIdx + 1;
                      
                      let bgColor = 'var(--surface-well)';
                      let borderColor = 'var(--border)';
                      let color = 'var(--text-muted)';
                      
                      if (isActive && !isRejected) {
                        bgColor = 'var(--primary)';
                        borderColor = 'var(--primary)';
                        color = 'white';
                      } else if (isCurrentFail) {
                        bgColor = 'var(--error)';
                        borderColor = 'var(--error)';
                        color = 'white';
                      } else if (isRejected && isActive) {
                        bgColor = 'var(--surface-highest)';
                        borderColor = 'var(--error)';
                        color = 'var(--error)';
                      }

                      return (
                        <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 1, width: 80 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: bgColor, border: `2px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.3s' }}>
                            {isActive && !isRejected ? <CheckCircle size={16} /> : isCurrentFail ? <XCircle size={16} /> : (idx + 1)}
                          </div>
                          <div style={{ fontSize: '0.75rem', fontWeight: isActive || isCurrentFail ? 700 : 500, color: isActive || isCurrentFail ? 'var(--text-high)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {isCurrentFail ? 'Rejected' : stage}
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
