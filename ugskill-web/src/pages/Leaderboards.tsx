import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { Skeleton } from '../components/loaders/Skeleton';
import { Trophy, Medal, Star, AlertCircle, User } from 'lucide-react';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { useAuthStore } from '../store/auth.store';

type Scope = 'global' | 'batch' | 'exam';

interface Entry {
  rank: number;
  userId?: string;
  name: string;
  score: number;
  track?: string;
  change?: string;
}

interface MyRank {
  rank: number;
  score: number;
  totalParticipants: number;
}

const RANK_ICON = (rank: number) => {
  if (rank === 1) return <Trophy size={20} color="gold" />;
  if (rank === 2) return <Medal size={20} color="silver" />;
  if (rank === 3) return <Medal size={20} color="#cd7f32" />;
  return <span style={{ fontWeight: 'bold', color: 'var(--text-low)' }}>#{rank}</span>;
};

export const Leaderboards: React.FC = () => {
  const { user } = useAuthStore();
  const [scope, setScope] = useState<Scope>('global');
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery<{ entries: Entry[]; total?: number; examId?: string }>({
    queryKey: ['leaderboard', scope],
    queryFn: async () => {
      const res = await api.get(`/leaderboards?scope=${scope}&limit=50`);
      return res.data.data ?? res.data;
    },
    staleTime: 30_000,
  });

  // Socket: Live updates
  React.useEffect(() => {
    const examId = (data as any)?.examId;
    if (scope !== 'exam' || !examId) return;

    const lbSocket = connectSocket('/leaderboard');
    lbSocket.emit('join:leaderboard', { examId });

    const handleUpdate = () => {
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
      qc.invalidateQueries({ queryKey: ['leaderboard-me'] });
    };

    lbSocket.on('leaderboard:update', handleUpdate);
    lbSocket.on('leaderboard:new-entry', handleUpdate);

    return () => {
      lbSocket.off('leaderboard:update', handleUpdate);
      lbSocket.off('leaderboard:new-entry', handleUpdate);
      disconnectSocket('/leaderboard');
    };
  }, [scope, data, qc]);

  const { data: myRank } = useQuery<MyRank>({
    queryKey: ['leaderboard-me', scope],
    queryFn: async () => {
      const res = await api.get(`/leaderboards/me?scope=${scope}`);
      return res.data.data ?? res.data;
    },
    retry: 1,
  });

  const entries: Entry[] = (data as any)?.entries ?? (data as any)?.rankings ?? (Array.isArray(data) ? data : []);

  const columns = [
    {
      key: 'rank',
      header: 'Rank',
      render: (row: any) => RANK_ICON(row.rank),
    },
    {
      key: 'name',
      header: 'Student',
      render: (row: any) => (
        <span style={{
          fontWeight: 500,
          color: row.userId === user?.id ? 'var(--primary-glow)' : 'var(--text-high)',
          display: 'flex', alignItems: 'center', gap: '0.35rem'
        }}>
          {row.userId === user?.id && <User size={13} />}
          {row.name}
        </span>
      ),
    },
    { key: 'track', header: 'Top Track' },
    {
      key: 'score',
      header: 'Score',
      render: (row: any) => <span style={{ fontWeight: 600, color: 'var(--primary-glow)' }}>{row.score?.toLocaleString()}</span>,
    },
    {
      key: 'change',
      header: 'Trend',
      render: (row: any) => {
        const change = row.change ?? '-';
        const isUp = change.startsWith('+');
        const isNeutral = change === '-';
        return (
          <span style={{
            color: isUp ? 'var(--success)' : isNeutral ? 'var(--text-lowest)' : 'var(--error)',
            fontWeight: 500,
          }}>
            {change}
          </span>
        );
      },
    },
  ];

  const SCOPE_LABELS: Record<Scope, string> = { global: 'Global', batch: 'My Batch', exam: 'Exam-Specific' };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: 'rgba(255, 215, 0, 0.1)', color: 'gold', marginBottom: '1rem' }}>
          <Star size={32} />
        </div>
        <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-high)', fontSize: '2.25rem', fontFamily: 'var(--font-display)' }}>Leaderboards</h1>
        <p style={{ margin: 0, color: 'var(--text-low)' }}>Compete with peers across cohorts and climb the ranks.</p>
      </header>

      {/* Scope tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', maxWidth: 600, margin: '0 auto', width: '100%' }}>
        {(Object.keys(SCOPE_LABELS) as Scope[]).map(s => (
          <button key={s} onClick={() => setScope(s)}
            style={{
              flex: 1,
              padding: '0.625rem',
              background: scope === s ? 'var(--primary-low)' : 'var(--surface-well)',
              border: scope === s ? '1px solid var(--primary-glow)' : '1px solid var(--surface-highest)',
              color: scope === s ? 'var(--primary-glow)' : 'var(--text-low)',
              cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
            }}
          >
            {SCOPE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* My Rank card */}
      {myRank && (
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', maxWidth: 600, margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <User size={20} style={{ color: 'var(--primary-glow)' }} />
            <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>Your Rank</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ color: 'var(--primary-glow)', fontWeight: 700, fontSize: '1.25rem' }}>#{myRank.rank}</span>
            <span style={{ color: 'var(--text-low)', fontSize: '0.875rem' }}>of {myRank.totalParticipants?.toLocaleString()}</span>
            <span style={{ color: 'var(--text-low)', fontSize: '0.875rem' }}>Score: <strong style={{ color: 'var(--text-high)' }}>{myRank.score?.toLocaleString()}</strong></span>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <Card title={`Top Performers — ${SCOPE_LABELS[scope]}`}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} variant="rectangular" height={48} />)}
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2rem', color: 'var(--text-low)' }}>
              <AlertCircle size={28} style={{ color: 'var(--error)', opacity: 0.6 }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Failed to load leaderboard data.</p>
            </div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-lowest)' }}>
              <Trophy size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              <p>No rankings available yet for this scope.</p>
            </div>
          ) : (
            <DataTable
              data={entries}
              columns={columns}
              page={1}
              totalPages={1}
            />
          )}
        </Card>
      </div>
    </div>
  );
};
