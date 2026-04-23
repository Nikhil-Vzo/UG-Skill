import React from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '../components/loaders/Skeleton';
import { Button } from '../components/ui/Button';
import { Bell, CheckCheck, AlertCircle, BookOpen, Trophy, Briefcase, Info, AlertTriangle } from 'lucide-react';
import api from '../lib/api';

interface Notification {
  id: string;
  type: 'course' | 'exam' | 'placement' | 'system' | 'info' | 'warning';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  course: <BookOpen size={16} />,
  exam: <Trophy size={16} />,
  placement: <Briefcase size={16} />,
  system: <Info size={16} />,
  info: <Info size={16} />,
  warning: <AlertTriangle size={16} />,
};

const TYPE_COLOR: Record<string, string> = {
  course: 'var(--primary-glow)',
  exam: 'gold',
  placement: 'var(--success)',
  system: 'var(--text-low)',
  info: 'var(--primary-glow)',
  warning: 'var(--warning)',
};

const timeAgo = (iso: string) => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const Notifications: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(`/notifications?page=${pageParam}&limit=20`);
      return res.data.data ?? res.data;
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30_000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications: Notification[] = data?.pages.flatMap((p: any) => p.notifications ?? p.data ?? p) ?? [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ padding: '2rem', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-high)' }}>Notifications</h1>
          {unreadCount > 0 && (
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-low)', fontSize: '0.875rem' }}>
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          leftIcon={<CheckCheck size={15} />}
          onClick={() => markAllMutation.mutate()}
          disabled={markAllMutation.isPending || unreadCount === 0}
          size="sm"
        >
          {markAllMutation.isPending ? 'Marking...' : 'Mark All Read'}
        </Button>
      </div>

      {/* Notifications list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {isLoading ? (
          [1, 2, 3, 4, 5].map(i => <Skeleton key={i} variant="rectangular" height={80} />)
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3rem', color: 'var(--text-low)' }}>
            <AlertCircle size={32} style={{ color: 'var(--error)', opacity: 0.6 }} />
            <p>Failed to load notifications. Please try again.</p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-lowest)' }}>
            <Bell size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
            <p style={{ margin: 0 }}>You're all caught up!</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>No notifications at the moment.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markOneMutation.mutate(n.id)}
              style={{
                padding: '1rem 1.25rem',
                background: n.isRead ? 'var(--surface-well)' : 'var(--primary-low)',
                border: `1px solid ${n.isRead ? 'var(--surface-highest)' : 'var(--primary-glow)'}`,
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                cursor: n.isRead ? 'default' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 36, height: 36, flexShrink: 0,
                background: `color-mix(in srgb, ${TYPE_COLOR[n.type] ?? 'var(--primary-glow)'} 10%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: TYPE_COLOR[n.type] ?? 'var(--primary-glow)',
              }}>
                {TYPE_ICON[n.type] ?? <Bell size={16} />}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-lowest)', flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-low)', lineHeight: 1.5 }}>{n.body}</p>
              </div>

              {/* Unread dot */}
              {!n.isRead && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-glow)', flexShrink: 0, marginTop: '0.35rem' }}></div>
              )}
            </div>
          ))
        )}

        {/* Load more */}
        {hasNextPage && (
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            style={{ alignSelf: 'center', marginTop: '0.5rem' }}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </div>
    </div>
  );
};
