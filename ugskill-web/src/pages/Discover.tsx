import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Star, Clock, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/loaders/Skeleton';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';

interface CatalogCourse {
  _id: string;
  title: string;
  instructor: { fullName: string } | string;
  rating?: number;
  reviewsCount?: number;
  durationWeeks?: number;
  level?: string;
  tags?: string[];
  category?: string;
  thumbnailUrl?: string;
}

const CATEGORIES = ['All', 'Frontend', 'Backend', 'Design', 'Data Science', 'DevOps', 'DSA', 'System Design'];

export const Discover: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<CatalogCourse[]>({
    queryKey: ['courses', 'catalog', activeCategory, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '20' });
      if (activeCategory !== 'All') params.set('category', activeCategory);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await api.get(`/lms/courses?${params}`);
      return res.data.data?.courses ?? res.data.data ?? res.data ?? [];
    },
    staleTime: 60_000,
    placeholderData: [],
  });

  const enrollMut = useMutation({
    mutationFn: (courseId: string) => api.post('/lms/enrollments', { courseId }),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      navigate(`/courses/${courseId}`);
    },
  });

  const courses = data ?? [];

  const resolveInstructor = (raw: CatalogCourse['instructor']): string => {
    if (!raw) return 'UGSkill Faculty';
    if (typeof raw === 'string') return raw;
    return raw.fullName ?? 'UGSkill Faculty';
  };

  const handleEnroll = useCallback((e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    enrollMut.mutate(courseId);
  }, [enrollMut]);

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Section */}
      <section className="glass-panel" style={{ padding: '3rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />
        
        <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>
          Discover Your Next Skill
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', maxWidth: '600px', marginBottom: '2rem', fontSize: '1.125rem' }}>
          Explore our enterprise-grade catalog of industry-leading courses and hands-on professional roadmap streams.
        </p>
        
        <div className="search-well" style={{ maxWidth: '600px' }}>
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Search for courses, skills, or certifications..." 
            className="search-input"
            style={{ fontSize: '1rem', padding: '1rem 0.5rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* Categories */}
      <section style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`surface-well ${activeCategory === cat ? 'active' : ''}`}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '20px',
              border: activeCategory === cat ? '1px solid var(--primary)' : '1px solid transparent',
              color: activeCategory === cat ? 'var(--primary)' : 'var(--on-surface-variant)',
              background: activeCategory === cat ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface-container-low)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              fontWeight: 500
            }}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Course Grid */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--on-surface)', fontFamily: 'var(--font-display)' }}>
            Trending in {activeCategory}
          </h2>
          {isLoading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />}
        </div>

        {isError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', padding: '1rem', background: 'var(--error-container)', marginBottom: '1rem' }}>
            <AlertCircle size={18} />
            <span>Failed to load courses. Ensure the API server is running.</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="surface-card" style={{ overflow: 'hidden' }}>
                <Skeleton variant="rectangular" height={160} />
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Skeleton variant="text" width="80%" height="20px" />
                  <Skeleton variant="text" width="50%" />
                  <Skeleton variant="text" width="60%" />
                </div>
              </div>
            ))
          ) : courses.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-low)' }}>
              No courses found{debouncedSearch ? ` for "${debouncedSearch}"` : ''}.
            </div>
          ) : (
            courses.map(course => (
              <div
                key={course._id}
                className="surface-card"
                style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                onClick={() => navigate(`/courses/${course._id}`)}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}
              >
                {/* Thumbnail */}
                <div style={{ height: '160px', background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : 'var(--surface-container-high)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem' }}>
                    {(course.tags ?? []).slice(0, 2).map(tag => (
                      <span key={tag} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: 'white', fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ color: 'var(--on-surface)', fontSize: '1.125rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                    {course.title}
                  </h3>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    by {resolveInstructor(course.instructor)}
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
                    {course.rating != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Star size={16} fill="var(--primary)" color="var(--primary)" />
                        <span style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{course.rating.toFixed(1)}</span>
                        {course.reviewsCount != null && <span>({course.reviewsCount})</span>}
                      </div>
                    )}
                    {course.durationWeeks != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={16} />
                        <span>{course.durationWeeks} Weeks</span>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{course.level ?? 'All Levels'}</span>
                    <Button
                      variant="primary"
                      size="sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      isLoading={enrollMut.isPending && enrollMut.variables === course._id}
                      onClick={(e) => handleEnroll(e, course._id)}
                    >
                      Enroll <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
