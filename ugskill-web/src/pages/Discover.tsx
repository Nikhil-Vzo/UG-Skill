import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Star, Clock, ChevronRight, Loader2, AlertCircle, 
  Filter, TrendingUp, Sparkles, BookOpen, ArrowRight, Zap,
  LayoutGrid, List, X, ChevronDown
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/loaders/Skeleton';
import { Badge } from '../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { useAuthStore } from '../store/auth.store';
import './Discover.css';

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

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended', icon: Sparkles },
  { value: 'rating', label: 'Highest Rated', icon: Star },
  { value: 'newest', label: 'Newest', icon: TrendingUp },
  { value: 'duration', label: 'Duration', icon: Clock },
] as const;

type SortOption = typeof SORT_OPTIONS[number]['value'];

type ViewMode = 'grid' | 'list';

export const Discover: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
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
    mutationFn: (courseId: string) =>
      api.post('/lms/enrollments', {
        enrollableType: 'course',
        enrollableId: courseId,
        source: 'self',
      }),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      // Go directly to the player after successful enrollment
      navigate(`/app/courses/${courseId}/player`);
    },
    onError: (error: any, courseId) => {
      // Already enrolled → just open the player
      const msg: string = error?.response?.data?.error?.message || '';
      if (msg.toLowerCase().includes('already enrolled') || error?.response?.status === 400) {
        navigate(`/app/courses/${courseId}/player`);
      }
    },
  });

  const { isAuthenticated } = useAuthStore();

  const { data: enrolledCourseIds = new Set<string>() } = useQuery({
    queryKey: ['my-enrollment-ids'],
    queryFn: async () => {
      if (!isAuthenticated) return new Set<string>();
      try {
        const res = await api.get('/lms/enrollments/mine?limit=100');
        const enrollments = res.data.data ?? res.data ?? [];
        const ids = (Array.isArray(enrollments) ? enrollments : [])
          .filter((e: any) => e.enrollableType === 'course')
          .map((e: any) => e.enrollableId);
        return new Set<string>(ids);
      } catch (e) {
        return new Set<string>();
      }
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let courses = (data ?? []).filter(c => !enrolledCourseIds.has(c._id));
    
    // Apply sorting
    switch (sortBy) {
      case 'rating':
        courses = [...courses].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'newest':
        courses = [...courses].sort((a, b) => new Date(b._id).getTime() - new Date(a._id).getTime());
        break;
      case 'duration':
        courses = [...courses].sort((a, b) => (b.durationWeeks ?? 0) - (a.durationWeeks ?? 0));
        break;
      default:
        // recommended - keep API order
        break;
    }
    
    return courses;
  }, [data, enrolledCourseIds, sortBy]);

  // Get featured courses (top rated)
  const featuredCourses = useMemo(() => {
    return filteredCourses
      .filter(c => c.rating && c.rating >= 4.5)
      .slice(0, 3);
  }, [filteredCourses]);

  const resolveInstructor = (raw: CatalogCourse['instructor']): string => {
    if (!raw) return 'UGSkill Faculty';
    if (typeof raw === 'string') return raw;
    return raw.fullName ?? 'UGSkill Faculty';
  };

  const handleEnroll = useCallback((e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    enrollMut.mutate(courseId);
  }, [enrollMut]);

  const getLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'primary';
      default: return 'default';
    }
  };

  return (
    <div className="discover-container">
      {/* Hero Section */}
      <section className="discover-hero">
        <div className="discover-hero-glow" />
        <div className="discover-hero-content">
          <div className="discover-hero-badge">
            <Sparkles size={14} />
            <span>New courses added weekly</span>
          </div>
          <h1 className="discover-hero-title">
            Discover Your Next Skill
          </h1>
          <p className="discover-hero-subtitle">
            Explore our enterprise-grade catalog of industry-leading courses and hands-on professional roadmap streams.
          </p>
          <div className="discover-search-wrapper">
            <div className="discover-search">
              <Search className="discover-search-icon" size={20} />
              <input 
                type="text" 
                placeholder="Search for courses, skills, or certifications..." 
                className="discover-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button 
                  className="discover-search-clear"
                  onClick={() => setSearch('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses - Only show when not searching */}
      {!debouncedSearch && featuredCourses.length > 0 && (
        <section className="discover-featured">
          <div className="discover-section-header">
            <div className="discover-section-title">
              <Zap size={20} className="discover-section-icon" />
              <h2>Featured Courses</h2>
            </div>
            <span className="discover-section-count">{featuredCourses.length} picks</span>
          </div>
          <div className="discover-featured-grid">
            {featuredCourses.map((course, index) => (
              <FeaturedCourseCard 
                key={course._id}
                course={course}
                index={index}
                onClick={() => navigate(`/app/courses/${course._id}`)}
                onEnroll={(e) => handleEnroll(e, course._id)}
                isEnrolling={enrollMut.isPending && enrollMut.variables === course._id}
                resolveInstructor={resolveInstructor}
              />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="discover-categories">
        <div className="discover-categories-scroll">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`discover-category-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Course Grid */}
      <section className="discover-courses">
        {/* Toolbar */}
        <div className="discover-toolbar">
          <div className="discover-toolbar-left">
            <h2 className="discover-toolbar-title">
              {debouncedSearch ? `Results for "${debouncedSearch}"` : `Trending in ${activeCategory}`}
            </h2>
            <span className="discover-toolbar-count">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="discover-toolbar-right">
            {/* Sort Dropdown */}
            <div className="discover-sort">
              <button 
                className="discover-sort-trigger"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} />
                <span>Sort</span>
                <ChevronDown size={14} className={showFilters ? 'rotate' : ''} />
              </button>
              {showFilters && (
                <div className="discover-sort-menu">
                  {SORT_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      className={`discover-sort-option ${sortBy === option.value ? 'active' : ''}`}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowFilters(false);
                      }}
                    >
                      <option.icon size={16} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* View Mode Toggle */}
            <div className="discover-view-toggle">
              <button 
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <List size={18} />
              </button>
            </div>
            
            {isLoading && <Loader2 size={18} className="discover-loading-spinner" />}
          </div>
        </div>

        {isError && (
          <div className="discover-error">
            <AlertCircle size={18} />
            <span>Failed to load courses. Ensure the API server is running.</span>
          </div>
        )}

        {/* Course Grid/List */}
        <div className={`discover-grid ${viewMode}`}>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} viewMode={viewMode} />
            ))
          ) : filteredCourses.length === 0 ? (
            <EmptyState search={debouncedSearch} />
          ) : (
            filteredCourses.map(course => (
              <CourseCard
                key={course._id}
                course={course}
                viewMode={viewMode}
                onClick={() => navigate(`/app/courses/${course._id}`)}
                onEnroll={(e) => handleEnroll(e, course._id)}
                isEnrolling={enrollMut.isPending && enrollMut.variables === course._id}
                resolveInstructor={resolveInstructor}
                getLevelColor={getLevelColor}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

// Sub-components

function FeaturedCourseCard({ 
  course, 
  index, 
  onClick, 
  onEnroll, 
  isEnrolling,
  resolveInstructor 
}: { 
  course: CatalogCourse; 
  index: number;
  onClick: () => void;
  onEnroll: (e: React.MouseEvent) => void;
  isEnrolling: boolean;
  resolveInstructor: (raw: CatalogCourse['instructor']) => string;
}) {
  return (
    <div 
      className="discover-featured-card"
      onClick={onClick}
      style={{ '--featured-index': index } as React.CSSProperties}
    >
      <div className="discover-featured-thumbnail">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} loading="lazy" />
        ) : (
          <div className="discover-featured-thumbnail-placeholder">
            <BookOpen size={32} />
          </div>
        )}
        <div className="discover-featured-rank">#{index + 1}</div>
      </div>
      <div className="discover-featured-content">
        <h3 className="discover-featured-title">{course.title}</h3>
        <p className="discover-featured-instructor">by {resolveInstructor(course.instructor)}</p>
        <div className="discover-featured-meta">
          {course.rating != null && (
            <span className="discover-featured-rating">
              <Star size={14} fill="currentColor" />
              {course.rating.toFixed(1)}
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            isLoading={isEnrolling}
            onClick={onEnroll}
            rightIcon={<ArrowRight size={14} />}
          >
            Enroll
          </Button>
        </div>
      </div>
    </div>
  );
}

function CourseCard({ 
  course, 
  viewMode, 
  onClick, 
  onEnroll, 
  isEnrolling,
  resolveInstructor,
  getLevelColor
}: { 
  course: CatalogCourse; 
  viewMode: ViewMode;
  onClick: () => void;
  onEnroll: (e: React.MouseEvent) => void;
  isEnrolling: boolean;
  resolveInstructor: (raw: CatalogCourse['instructor']) => string;
  getLevelColor: (level?: string) => string;
}) {
  return (
    <div 
      className={`discover-course-card ${viewMode}`}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="discover-course-thumbnail">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} loading="lazy" />
        ) : (
          <div className="discover-course-thumbnail-placeholder">
            <BookOpen size={40} />
          </div>
        )}
        <div className="discover-course-tags">
          {(course.tags ?? []).slice(0, 2).map(tag => (
            <span key={tag} className="discover-course-tag">{tag}</span>
          ))}
        </div>
        {course.category && (
          <Badge variant="primary" size="sm" className="discover-course-category">
            {course.category}
          </Badge>
        )}
      </div>
      
      <div className="discover-course-content">
        <div className="discover-course-header">
          <h3 className="discover-course-title">{course.title}</h3>
          <p className="discover-course-instructor">by {resolveInstructor(course.instructor)}</p>
        </div>
        
        <div className="discover-course-stats">
          {course.rating != null && (
            <div className="discover-course-stat">
              <Star size={16} fill="var(--primary)" color="var(--primary)" />
              <span className="discover-course-rating-value">{course.rating.toFixed(1)}</span>
              {course.reviewsCount != null && (
                <span className="discover-course-reviews">({course.reviewsCount})</span>
              )}
            </div>
          )}
          {course.durationWeeks != null && (
            <div className="discover-course-stat">
              <Clock size={16} />
              <span>{course.durationWeeks} Weeks</span>
            </div>
          )}
        </div>

        <div className="discover-course-footer">
          <Badge variant={getLevelColor(course.level) as any} size="sm">
            {course.level ?? 'All Levels'}
          </Badge>
          <Button
            variant="primary"
            size="sm"
            isLoading={isEnrolling}
            onClick={onEnroll}
            rightIcon={<ChevronRight size={14} />}
          >
            Enroll
          </Button>
        </div>
      </div>
    </div>
  );
}

function CourseCardSkeleton({ viewMode }: { viewMode: ViewMode }) {
  return (
    <div className={`discover-course-card skeleton ${viewMode}`}>
      <Skeleton variant="rectangular" className="discover-skeleton-thumbnail" />
      <div className="discover-course-content">
        <Skeleton variant="text" width="85%" height={22} className="mb-2" />
        <Skeleton variant="text" width="50%" height={16} className="mb-4" />
        <div className="discover-course-stats">
          <Skeleton variant="text" width="60px" height={16} />
          <Skeleton variant="text" width="80px" height={16} />
        </div>
        <div className="discover-course-footer">
          <Skeleton variant="text" width="70px" height={24} />
          <Skeleton variant="rectangular" width="80px" height={32} style={{ borderRadius: '6px' }} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="discover-empty">
      <div className="discover-empty-icon">
        <Search size={48} />
      </div>
      <h3 className="discover-empty-title">
        {search ? 'No courses found' : 'No courses available'}
      </h3>
      <p className="discover-empty-text">
        {search 
          ? `We couldn't find any courses matching "${search}". Try a different search term or browse all categories.`
          : 'Check back later for new courses, or browse other categories.'
        }
      </p>
    </div>
  );
}
