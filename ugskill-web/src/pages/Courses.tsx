import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStore } from '../store/dashboard.store';
import { Skeleton } from '../components/loaders/Skeleton';
import { CourseCard } from '../components/features/course/CourseCard';
import { Button } from '../components/ui/Button';
import { Search, Filter, BookOpen, PlayCircle, LayoutGrid, List } from 'lucide-react';
import { IconButton } from '../components/ui/IconButton';
import { useDebounce } from '../hooks/useDebounce';
import './Courses.css';

export const Courses: React.FC = () => {
  const navigate = useNavigate();
  const { courses, isLoading, fetchDashboardData } = useDashboardStore();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-progress' | 'completed'>('all');
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    if (courses.length === 0) {
      fetchDashboardData();
    }
  }, [courses.length, fetchDashboardData]);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let result = [...courses];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(c => c.title.toLowerCase().includes(q) || c.instructor?.toLowerCase().includes(q));
    }
    if (filterStatus === 'in-progress') result = result.filter(c => (c.progress || 0) > 0 && (c.progress || 0) < 100);
    if (filterStatus === 'completed') result = result.filter(c => (c.progress || 0) === 100);
    result.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    return result;
  }, [courses, debouncedSearch, filterStatus]);

  // Find course to continue
  const continueCourse = useMemo(() => {
    if (!courses.length) return null;
    const inProgress = courses.filter(c => (c.progress || 0) > 0 && (c.progress || 0) < 100);
    return inProgress.sort((a, b) => (b.progress || 0) - (a.progress || 0))[0] || courses[0];
  }, [courses]);

  // Stats
  const stats = useMemo(() => ({
    total: courses.length,
    inProgress: courses.filter(c => (c.progress || 0) > 0 && (c.progress || 0) < 100).length,
    completed: courses.filter(c => (c.progress || 0) === 100).length,
  }), [courses]);

  return (
    <div className="courses-page">
      <header className="courses-header">
        <div className="courses-title-section">
          <div className="courses-badge">
            <BookOpen size={14} /> Learning Center
          </div>
          <h1 className="courses-title">My Courses</h1>
          <p className="courses-subtitle">
            {stats.total > 0 
              ? `${stats.inProgress} in progress · ${stats.completed} completed`
              : 'Start your learning journey by exploring our catalog'
            }
          </p>
        </div>
        
        <div className="courses-toolbar">
          <div className="search-well courses-search">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="courses-view-toggle">
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Continue Learning Block */}
      {continueCourse && !isLoading && (
        <section className="continue-learning-card">
          <div className="continue-content">
            <div className="continue-badge">Continue Learning</div>
            <h3 className="continue-title">{continueCourse.title}</h3>
            <p className="continue-instructor">by {continueCourse.instructor}</p>
            <div className="continue-progress">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${continueCourse.progress || 0}%` }} />
              </div>
              <span>{continueCourse.progress || 0}% complete</span>
            </div>
            <Button 
              variant="primary" 
              size="sm" 
              leftIcon={<PlayCircle size={16} />}
              onClick={() => navigate(`/app/courses/${continueCourse.id}/player`)}
            >
              Resume Course
            </Button>
          </div>
          <div className="continue-thumbnail">
            {continueCourse.thumbnail ? (
              <img src={continueCourse.thumbnail} alt={continueCourse.title} />
            ) : (
              <div className="placeholder-thumbnail" />
            )}
          </div>
        </section>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {(['all', 'in-progress', 'completed'] as const).map(status => (
          <button
            key={status}
            className={filterStatus === status ? 'active' : ''}
            onClick={() => setFilterStatus(status)}
          >
            {status === 'all' ? 'All Courses' : status === 'in-progress' ? 'In Progress' : 'Completed'}
            <span className="filter-count">
              {status === 'all' ? stats.total : status === 'in-progress' ? stats.inProgress : stats.completed}
            </span>
          </button>
        ))}
      </div>

      {/* Course Grid/List */}
      <section className={`courses-container ${viewMode}`}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="course-skeleton-card">
              <Skeleton variant="rectangular" height={viewMode === 'list' ? 80 : 140} />
              <Skeleton variant="text" width="80%" height="24px" className="mt-3" />
              <Skeleton variant="rounded" height="8px" className="mt-2" />
              <Skeleton variant="text" width="40%" className="mt-2" />
            </div>
          ))
        ) : filteredCourses.length === 0 ? (
          <div className="courses-empty">
            <BookOpen size={48} />
            <h3>No courses found</h3>
            <p>{search ? 'Try adjusting your search terms' : 'Start learning by exploring our catalog'}</p>
            <Button variant="primary" onClick={() => navigate('/app/discover')}>
              Discover Courses
            </Button>
          </div>
        ) : (
          filteredCourses.map(course => (
            <CourseCard key={course.id} course={course} onContinue={(id) => navigate(`/app/courses/${id}/player`)} />
          ))
        )}
      </section>
    </div>
  );
};
