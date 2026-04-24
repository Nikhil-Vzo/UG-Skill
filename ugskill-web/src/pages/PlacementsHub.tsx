import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase, MapPin, Clock, Video, Calendar,
  CheckCircle, XCircle, AlertCircle, Search, Loader2, MessageSquare, ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/loaders/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import api from '../lib/api';

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
  return (
    <div
      className="surface-card"
      onClick={onClick}
      style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.875rem', transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 0, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.125rem', color: 'white', flexShrink: 0 }}>
            {initial}
          </div>
          <div>
            <div style={{ color: 'var(--text-high)', fontWeight: 700, fontSize: '0.9375rem' }}>{companyName}</div>
            <div style={{ color: 'var(--text-low)', fontSize: '0.8125rem' }}>{drive.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{drive.targetRoles?.join(', ')}</div>
          </div>
        </div>
        <Badge variant={cfg.variant} size="sm">{cfg.icon} {cfg.label}</Badge>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-low)' }}>
        {drive.location && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={13} />{drive.location}</div>}
        {drive.package && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Briefcase size={13} />{drive.package}</div>}
        {drive.registrationDeadline && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={13} />Due: {formatDeadline(drive.registrationDeadline)}</div>}
      </div>

      {(drive.cgpaCutoff ?? 0) > 0 && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-lowest)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--warning)' }}>CGPA ≥ {drive.cgpaCutoff}</span>
          {(drive.branches ?? []).length > 0 && (
            <><span>·</span><span>Branches: {(drive.branches ?? []).slice(0, 3).join(', ')}{(drive.branches ?? []).length > 3 ? ` +${(drive.branches ?? []).length - 3}` : ''}</span></>
          )}
        </div>
      )}

      {drive.status === 'active' && (
        <button
          onClick={e => { e.stopPropagation(); onApply(); }}
          disabled={isApplying}
          style={{ alignSelf: 'flex-start', padding: '0.4rem 0.875rem', background: 'var(--primary-glow)', color: 'white', border: 'none', cursor: isApplying ? 'wait' : 'pointer', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          {isApplying ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          Apply
        </button>
      )}
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
  const [view, setView] = useState<'grid' | 'kanban'>('grid');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | DriveStatus>('all');
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

  const applyMut = useMutation({
    mutationFn: (driveId: string) => api.post('/placements/registrations', { driveId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement-drives'] });
      setApplyingId(null);
    },
    onError: () => setApplyingId(null),
  });

  const filtered = drives.filter(d => {
    const { name: companyName } = resolveCompany(d);
    const q = debouncedSearch.toLowerCase();
    const matchesSearch = companyName.toLowerCase().includes(q) || d.name.toLowerCase().includes(q);
    const matchesFilter = filter === 'all' || d.status === filter;
    return matchesSearch && matchesFilter;
  });

  const myApps = drives.filter(d => ['applied', 'shortlisted', 'rejected'].includes(d.status));

  const statsConfig = [
    { label: 'Active Drives', val: drives.filter(d => d.status === 'active').length, color: 'var(--success)' },
    { label: 'Applied', val: myApps.filter(d => d.status === 'applied').length, color: 'var(--primary-glow)' },
    { label: 'Shortlisted', val: myApps.filter(d => d.status === 'shortlisted').length, color: 'var(--warning)' },
    { label: 'Rejected', val: myApps.filter(d => d.status === 'rejected').length, color: 'var(--error)' },
  ];

  const handleApply = (driveId: string) => {
    setApplyingId(driveId);
    applyMut.mutate(driveId);
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-high)', margin: 0 }}>Placement Hub</h1>
          <p style={{ color: 'var(--text-low)', fontSize: '0.875rem', marginTop: '0.25rem', margin: '0.25rem 0 0' }}>Track active drives, manage applications, prepare for interviews.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setView(v => v === 'grid' ? 'kanban' : 'grid')}
            style={{ padding: '0.5rem 0.875rem', background: 'var(--surface-well)', border: '1px solid var(--surface-highest)', color: 'var(--text-low)', cursor: 'pointer', fontSize: '0.8125rem' }}
          >
            {view === 'grid' ? '⬛ Kanban View' : '⊞ Grid View'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
              <Skeleton variant="text" width="40%" height="32px" />
              <Skeleton variant="text" width="70%" />
            </div>
          ))
        ) : (
          statsConfig.map(s => (
            <div key={s.label} className="glass-panel" style={{ padding: '1rem 1.25rem', borderTop: `2px solid ${s.color}` }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.val}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
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

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div className="search-well" style={{ flex: 1, minWidth: 240 }}>
          <Search className="search-icon" size={16} />
          <input type="text" placeholder="Search companies, roles..." className="search-input" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {isLoading && <Loader2 size={18} style={{ alignSelf: 'center', animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />}
        {(['all', 'open', 'applied', 'shortlisted', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '0.5rem 0.875rem', background: filter === f ? 'var(--primary-low)' : 'var(--surface-well)', border: filter === f ? '1px solid var(--primary-glow)' : '1px solid var(--surface-highest)', color: filter === f ? 'var(--primary-glow)' : 'var(--text-low)', cursor: 'pointer', fontSize: '0.8125rem', textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

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
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-lowest)' }}>
              No drives match your search.
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
      ) : (
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
                    onClick={() => navigate(`/placements/${d.id}`)}
                    onApply={() => handleApply(d.id)}
                    isApplying={applyingId === d.id}
                  />
                ))}
              </KanbanCol>
            );
          })}
        </div>
      )}
    </div>
  );
};
