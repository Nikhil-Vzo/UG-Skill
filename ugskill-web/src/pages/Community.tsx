import React, { useState } from 'react';
import {
  MessageSquare, ThumbsUp, Bookmark, Share2, Plus, Search,
  TrendingUp, Clock, Pin, AlertCircle, X
} from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/loaders/Skeleton';
import { useAuthStore } from '../store/auth.store';
import api from '../lib/api';
import { useDebounce } from '../lib/useDebounce';

/* ─────────── Types ─────────── */
interface Post {
  id: string;
  author: string;
  avatar: string;
  role: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  replies: number;
  timeAgo: string;
  pinned?: boolean;
  liked?: boolean;
  bookmarked?: boolean;
}

interface Reply {
  id: string;
  author: string;
  avatar: string;
  role: string;
  content: string;
  timeAgo: string;
}

const TAGS = ['All', 'DSA', 'Google', 'Microsoft', 'Resume', 'Interview Exp', 'Announcement', 'Career'];
const AVATAR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

/* ─────────── Post Card ─────────── */
const PostCard: React.FC<{ post: Post; onLike: () => void; onBookmark: () => void; onRepliesClick: () => void }> = ({ post, onLike, onBookmark, onRepliesClick }) => (
  <div
    className="surface-card"
    style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', position: 'relative' }}
  >
    {post.pinned && (
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--warning)', fontSize: '0.75rem' }}>
        <Pin size={12} fill="currentColor" /> Pinned
      </div>
    )}

    {/* Author */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ width: 36, height: 36, borderRadius: 0, background: AVATAR_COLORS[post.id.charCodeAt(post.id.length - 1) % AVATAR_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
        {post.avatar || post.author.slice(0, 2).toUpperCase()}
      </div>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-high)' }}>{post.author}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-lowest)' }}>{post.role} · {post.timeAgo}</div>
      </div>
    </div>

    {/* Content */}
    <div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-high)', margin: '0 0 0.5rem' }}>{post.title}</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-low)', lineHeight: 1.65, margin: 0 }}>{post.content}</p>
    </div>

    {/* Tags */}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
      {(post.tags ?? []).map(t => <Badge key={t} variant="secondary" size="sm">{t}</Badge>)}
    </div>

    {/* Actions */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingTop: '0.5rem', borderTop: '1px solid var(--surface-highest)' }}>
      <button onClick={onLike} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', color: post.liked ? 'var(--primary-glow)' : 'var(--text-low)', cursor: 'pointer', fontSize: '0.8125rem', padding: 0 }}>
        <ThumbsUp size={15} fill={post.liked ? 'currentColor' : 'none'} /> {post.likes}
      </button>
      <button onClick={onRepliesClick} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: '0.8125rem', padding: 0 }}>
        <MessageSquare size={15} /> {post.replies}
      </button>
      <button onClick={onBookmark} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', color: post.bookmarked ? 'var(--warning)' : 'var(--text-low)', cursor: 'pointer', fontSize: '0.8125rem', padding: 0, marginLeft: 'auto' }}>
        <Bookmark size={15} fill={post.bookmarked ? 'currentColor' : 'none'} />
      </button>
      <button style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: '0.8125rem', padding: 0 }}>
        <Share2 size={15} />
      </button>
    </div>
  </div>
);

/* ─────────── Main ─────────── */
export const Community: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTag, setActiveTag] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'trending' | 'recent'>('trending');
  const [showCompose, setShowCompose] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const debouncedSearch = useDebounce(search, 450);

  // Build query params
  const params = new URLSearchParams({ sort: sort === 'trending' ? 'likes' : 'createdAt', limit: '10' });
  if (debouncedSearch) params.set('q', debouncedSearch);
  if (activeTag !== 'All') params.set('tag', activeTag);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ['community-posts', debouncedSearch, activeTag, sort],
    queryFn: async ({ pageParam = 1 }) => {
      params.set('page', String(pageParam));
      const res = await api.get(`/community/posts?${params.toString()}`);
      return res.data.data ?? res.data;
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30_000,
  });

  const posts: Post[] = data?.pages.flatMap((p: any) => p.posts ?? p.data ?? p) ?? [];

  const likeMutation = useMutation({
    mutationFn: (postId: string) => api.post(`/community/posts/${postId}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-posts'] }),
  });

  const bookmarkMutation = useMutation({
    mutationFn: (postId: string) => api.post(`/community/posts/${postId}/bookmark`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-posts'] }),
  });

  const publishMutation = useMutation({
    mutationFn: (payload: { title: string; content: string }) => {
      // Strip any HTML tags for basic XSS protection
      const sanitize = (s: string) => s.replace(/<[^>]*>/g, '');
      return api.post('/community/posts', { title: sanitize(payload.title), content: sanitize(payload.content) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setNewPost({ title: '', content: '' });
      setShowCompose(false);
    },
  });

  const handlePublish = () => {
    if (!newPost.title.trim()) return;
    publishMutation.mutate(newPost);
  };

  const { data: repliesData, isLoading: isLoadingReplies } = useQuery({
    queryKey: ['community-replies', activePostId],
    queryFn: async () => {
      const res = await api.get(`/community/posts/${activePostId}/replies`);
      return res.data.data ?? res.data;
    },
    enabled: !!activePostId,
  });

  const replies: Reply[] = repliesData ?? [];

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-high)', margin: 0 }}>Community Board</h1>
          <p style={{ color: 'var(--text-low)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Placement tips, interview experiences, and peer discussions.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={15} />} onClick={() => setShowCompose(c => !c)}>
          New Post
        </Button>
      </div>

      {/* Compose */}
      {showCompose && (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <h3 style={{ margin: 0, color: 'var(--text-high)', fontSize: '0.9375rem', fontFamily: 'var(--font-display)' }}>Share with the community</h3>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-lowest)' }}>Posting as {user?.fullName ?? 'you'}</p>
          <input
            placeholder="Post title..."
            value={newPost.title}
            onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
            style={{ background: 'var(--surface-well)', border: '1px solid var(--surface-highest)', padding: '0.75rem 1rem', color: 'var(--text-high)', fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--font-primary)' }}
          />
          <textarea
            placeholder="Share your experience, ask a question, or post an announcement..."
            value={newPost.content}
            onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
            rows={4}
            style={{ background: 'var(--surface-well)', border: '1px solid var(--surface-highest)', padding: '0.75rem 1rem', color: 'var(--text-high)', fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-primary)' }}
          />
          {publishMutation.isError && (
            <p style={{ color: 'var(--error)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 }}>
              <AlertCircle size={14} /> Failed to publish. Please try again.
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="ghost" onClick={() => setShowCompose(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handlePublish}
              disabled={publishMutation.isPending || !newPost.title.trim()}
            >
              {publishMutation.isPending ? 'Publishing...' : 'Publish Post'}
            </Button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-well" style={{ flex: 1, minWidth: 220 }}>
          <Search className="search-icon" size={16} />
          <input type="text" placeholder="Search posts..." className="search-input" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['trending', 'recent'] as const).map(s => (
            <button key={s} onClick={() => setSort(s)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.75rem', background: sort === s ? 'var(--primary-low)' : 'var(--surface-well)', border: sort === s ? '1px solid var(--primary-glow)' : '1px solid var(--surface-highest)', color: sort === s ? 'var(--primary-glow)' : 'var(--text-low)', cursor: 'pointer', fontSize: '0.8125rem' }}>
              {s === 'trending' ? <TrendingUp size={13} /> : <Clock size={13} />}
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {TAGS.map(t => (
          <button key={t} onClick={() => setActiveTag(t)}
            style={{ padding: '0.375rem 0.875rem', background: activeTag === t ? 'var(--primary-low)' : 'transparent', border: activeTag === t ? '1px solid var(--primary-glow)' : '1px solid var(--surface-highest)', color: activeTag === t ? 'var(--primary-glow)' : 'var(--text-low)', cursor: 'pointer', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={180} />)
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-low)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={32} style={{ color: 'var(--error)', opacity: 0.6 }} />
            <p>Failed to load posts. Please check your connection and try again.</p>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-lowest)' }}>No posts found.</div>
        ) : (
          posts.map(p => (
            <PostCard
              key={p.id}
              post={p}
              onLike={() => likeMutation.mutate(p.id)}
              onBookmark={() => bookmarkMutation.mutate(p.id)}
              onRepliesClick={() => setActivePostId(p.id)}
            />
          ))
        )}

        {/* Load More */}
        {hasNextPage && (
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            style={{ alignSelf: 'center' }}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </div>

      {/* Slide-over Drawer for Replies */}
      {activePostId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div style={{ position: 'absolute', inset: 0 }} onClick={() => setActivePostId(null)} />
          <div style={{ width: 400, maxWidth: '100%', backgroundColor: 'var(--surface-base)', borderLeft: '1px solid var(--surface-highest)', position: 'relative', zIndex: 51, display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--surface-highest)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-high)' }}>Replies</h2>
              <button onClick={() => setActivePostId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {isLoadingReplies ? (
                [1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={80} />)
              ) : replies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-low)' }}>No replies yet. Be the first to reply!</div>
              ) : (
                replies.map(r => (
                  <div key={r.id} style={{ padding: '1rem', background: 'var(--surface-well)', borderRadius: 8, border: '1px solid var(--surface-highest)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--primary-glow)' }}>
                        {r.avatar || r.author.slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-high)' }}>{r.author}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-lowest)' }}>· {r.timeAgo}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-low)', lineHeight: 1.5 }}>{r.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
