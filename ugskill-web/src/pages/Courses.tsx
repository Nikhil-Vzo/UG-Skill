import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStore } from '../store/dashboard.store';
import { Skeleton } from '../components/loaders/Skeleton';
import { CourseCard } from '../components/features/course/CourseCard';
import { Search, Filter } from 'lucide-react';
import { IconButton } from '../components/ui/IconButton';

export const Courses: React.FC = () => {
  const navigate = useNavigate();
  const { courses, isLoading, fetchDashboardData } = useDashboardStore();

  useEffect(() => {
    // If not loaded yet, fetch it
    if (courses.length === 0) {
      fetchDashboardData();
    }
  }, [courses.length, fetchDashboardData]);

  return (
    <div className="flex flex-col gap-8">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>
            My Courses
          </h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>
            Resume learning where you left off or explore new materials.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="search-well" style={{ width: '220px' }}>
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Filter courses..." 
              className="search-input"
            />
          </div>
          <IconButton 
            icon={<Filter size={18} />} 
            aria-label="Filter" 
            variant="secondary"
          />
        </div>
      </header>

      {/* Recommended or Continue Block */}
      {courses.length > 0 && !isLoading && (
        <section className="glass-panel" style={{ padding: '2rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', color: 'var(--on-surface)', marginBottom: '1rem' }}>Pick Up Where You Left Off</h2>
          {/* Display highest priority or most recent course */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h3 style={{ color: 'var(--primary)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>{courses[0].title}</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                You were making great progress with {courses[0].instructor}. You are 15 minutes away from finishing Module 2!
              </p>
              <button className="base-btn btn-primary btn-md" onClick={() => navigate(`/app/courses/${courses[0].id}/player`)}>Resume Course</button>
            </div>
            <div style={{ flex: 1, minWidth: '250px' }}>
              {/* Could be a thumbnail in a real app, currently just an aesthetic block */}
              <div style={{ height: '140px', background: 'var(--surface-container-high)', borderRadius: '8px', border: '1px dashed var(--outline-variant)' }} />
            </div>
          </div>
        </section>
      )}

      {/* Full Library Grid */}
      <section>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="surface-card" style={{ padding: '1.5rem' }}>
                <Skeleton variant="text" width="80%" height="24px" className="mb-4" />
                <Skeleton variant="rounded" height="8px" className="mb-2" />
                <Skeleton variant="text" width="40%" />
              </div>
            ))
          ) : courses.length === 0 ? (
            <p style={{ color: 'var(--on-surface-variant)' }}>You have not enrolled in any courses yet.</p>
          ) : (
            courses.map(course => (
              <CourseCard key={course.id} course={course} onContinue={(id) => navigate(`/app/courses/${id}/player`)} />
            ))
          )}
        </div>
      </section>
    </div>
  );
};
