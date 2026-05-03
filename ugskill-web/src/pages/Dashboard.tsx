import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDashboardStore } from '../store/dashboard.store';
import { useAuthStore } from '../store/auth.store';
import { Skeleton } from '../components/loaders/Skeleton';
import { CourseCard } from '../components/features/course/CourseCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  Flame, Clock, Calendar, AlertTriangle, TrendingUp, BookOpen,
  Award, Zap, Target, ArrowRight, PlayCircle, ChevronRight, Sparkles,
  BarChart3, Trophy, Star, Activity
} from 'lucide-react';
import api from '../lib/api';
import './Dashboard.css';

/** Returns days until a given ISO date string (negative = overdue) */
function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

/** Format relative deadline label */
function deadlineLabel(dateStr: string): string {
  const d = daysUntil(dateStr);
  if (d < 0) return `OVERDUE ${Math.abs(d)}d`;
  if (d === 0) return 'DUE TODAY';
  return `T-MINUS ${d} DAY${d === 1 ? '' : 'S'}`;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { courses, assessments, isLoading, error, fetchDashboardData } = useDashboardStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fetch streak from real API — falls back to empty array while loading/error
  const { data: streakData } = useQuery<boolean[]>({
    queryKey: ['streak'],
    queryFn: async () => {
      const res = await api.get('/lms/streaks/me');
      const payload = res.data.data ?? res.data;
      if (Array.isArray(payload)) return payload;
      const activeCount = Math.min(Math.max(Number(payload?.currentStreak ?? 0), 0), 7);
      return Array.from({ length: 7 }, (_, index) => index >= 7 - activeCount);
    },
    // Silently fail — streaks are non-critical
    retry: false,
  });

  // 7-slot streak array: use API result or fallback to all-false
  const streakDays: boolean[] = streakData?.length === 7
    ? streakData
    : [false, false, false, false, false, false, false];

  const activeDays = streakDays.filter(Boolean).length;

  // Calculate overall progress stats
  const overallProgress = useMemo(() => {
    if (!courses.length) return 0;
    return Math.round(courses.reduce((acc, c) => acc + (c.progress || 0), 0) / courses.length);
  }, [courses]);

  const completedCourses = useMemo(() => 
    courses.filter(c => (c.progress || 0) === 100).length,
    [courses]
  );

  const upcomingDeadlines = useMemo(() => 
    assessments.filter(a => a.closingDate && daysUntil(a.closingDate) <= 7).length,
    [assessments]
  );

  return (
    <div className="dashboard-content flex flex-col gap-8" style={{ padding: '2rem' }}>
      {error && (
        <div style={{ backgroundColor: 'var(--error-container)', color: 'var(--on-error-container)', padding: '1rem', borderRadius: '0px', marginBottom: '1rem', borderLeft: '4px solid var(--error)' }}>
          <strong>System Alert: </strong>{error}
        </div>
      )}
      <header className="dashboard-header">
        <div className="welcome-section">
          <div className="welcome-badge">
            <Sparkles size={14} /> Student Dashboard
          </div>
          <h1 className="welcome-title">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Initiate'}
            <span className="welcome-emoji">👋</span>
          </h1>
          <p className="welcome-subtitle">
            Track your progress, stay on top of deadlines, and keep learning.
          </p>
        </div>
        <div className="quick-actions">
          <Button 
            variant="primary" 
            size="sm" 
            leftIcon={<PlayCircle size={16} />}
            onClick={() => navigate('/app/discover')}
          >
            Explore Courses
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            leftIcon={<Target size={16} />}
            onClick={() => navigate('/app/placements')}
          >
            View Placements
          </Button>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="stats-overview">
        <div className="stat-mini-card progress-card">
          <div className="stat-mini-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
            <BarChart3 size={20} />
          </div>
          <div className="stat-mini-content">
            <span className="stat-mini-value" style={{ color: 'var(--success)' }}>{overallProgress}%</span>
            <span className="stat-mini-label">Avg Progress</span>
          </div>
        </div>
        
        <div className="stat-mini-card courses-card">
          <div className="stat-mini-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
            <BookOpen size={20} />
          </div>
          <div className="stat-mini-content">
            <span className="stat-mini-value" style={{ color: 'var(--primary)' }}>{completedCourses}/{courses.length}</span>
            <span className="stat-mini-label">Completed</span>
          </div>
        </div>
        
        <div className="stat-mini-card deadline-card">
          <div className="stat-mini-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="stat-mini-content">
            <span className="stat-mini-value" style={{ color: 'var(--warning)' }}>{upcomingDeadlines}</span>
            <span className="stat-mini-label">Due Soon</span>
          </div>
        </div>
        
        <div className="stat-mini-card streak-card">
          <div className="stat-mini-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <Flame size={20} />
          </div>
          <div className="stat-mini-content">
            <span className="stat-mini-value" style={{ color: '#ef4444' }}>{activeDays}</span>
            <span className="stat-mini-label">Day Streak</span>
          </div>
        </div>
      </section>

      {/* Widgets Top Row */}
      <section className="dashboard-widgets">
        
        {/* Enhanced Streak Calendar Widget */}
        <div className="glass-panel streak-widget">
          <div className="widget-header">
            <div className="widget-title">
              <Flame color="#ef4444" size={20} />
              <span>Activity Streak</span>
            </div>
            <Badge variant={activeDays >= 5 ? 'success' : 'default'} size="sm">
              {activeDays >= 5 ? '🔥 On Fire!' : `${activeDays} days active`}
            </Badge>
          </div>
          <div className="streak-calendar">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
              <div key={i} className={`streak-day ${streakDays[i] ? 'active' : ''}`}>
                <div className="streak-bar" />
                <span className="streak-label">{d.slice(0, 1)}</span>
              </div>
            ))}
          </div>
          <div className="streak-message">
            {activeDays === 0 ? 'Start your streak today! 💪' :
             activeDays < 3 ? 'Good start! Keep going!' :
             activeDays < 5 ? 'You\'re building momentum!' :
             activeDays < 7 ? 'Incredible consistency!' : 'Perfect week! 🎉'}
          </div>
        </div>

        {/* Enhanced Active Course Widget */}
        <div className="glass-panel active-course-widget">
          <div className="widget-header">
            <div className="widget-title">
              <Zap color="var(--warning)" size={20} />
              <span>Continue Learning</span>
            </div>
          </div>
          <div className="active-course-content">
            {isLoading ? (
               <Skeleton variant="rectangular" height={120} />
            ) : courses.length > 0 ? (
               <>
                 <div className="active-course-info">
                   <h4 className="active-course-title">{courses[0].title}</h4>
                   <p className="active-course-instructor">by {courses[0].instructor}</p>
                 </div>
                 <div className="progress-section">
                   <div className="progress-header">
                     <span className="progress-text">{courses[0].progress ?? 0}% Complete</span>
                     <span className="progress-modules">{Math.round((courses[0].progress || 0) / 100 * 12)}/12 modules</span>
                   </div>
                   <div className="progress-bar-container">
                     <div className="progress-bar" style={{ width: `${courses[0].progress ?? 0}%` }} />
                   </div>
                 </div>
                 <Button
                   variant="primary"
                   size="sm"
                   className="resume-btn"
                   rightIcon={<ArrowRight size={14} />}
                   onClick={() => navigate(`/app/courses/${courses[0].id}/player`)}
                 >
                   Resume Course
                 </Button>
               </>
            ) : (
               <div className="empty-state">
                 <BookOpen size={32} color="var(--text-low)" />
                 <span>No active courses</span>
                 <Button variant="outline" size="sm" onClick={() => navigate('/app/discover')}>
                   Browse Courses
                 </Button>
               </div>
            )}
          </div>
        </div>

        {/* Enhanced Deadlines Widget */}
        <div className="glass-panel deadlines-widget">
          <div className="widget-header">
            <div className="widget-title">
              <AlertTriangle color="var(--warning)" size={20} />
              <span>Upcoming Deadlines</span>
            </div>
            {upcomingDeadlines > 0 && (
              <Badge variant="warning" size="sm">{upcomingDeadlines} due soon</Badge>
            )}
          </div>
          <div className="deadlines-list">
             {isLoading ? (
               <Skeleton variant="rectangular" height={100} />
             ) : assessments.length === 0 ? (
               <div className="empty-deadlines">
                 <Trophy size={32} color="var(--success)" />
                 <span>All caught up! 🎉</span>
                 <p>No pending assignments or exams</p>
               </div>
             ) : (
               assessments.slice(0, 3).map(assm => (
                 <div key={assm.id} className={`deadline-item ${assm.closingDate && daysUntil(assm.closingDate) < 0 ? 'overdue' : ''}`}>
                   <div className="deadline-icon">
                     <Calendar size={16} />
                   </div>
                   <div className="deadline-info">
                     <span className="deadline-title">{assm.title}</span>
                     <span className={`deadline-date ${assm.closingDate && daysUntil(assm.closingDate) <= 2 ? 'urgent' : ''}`}>
                       {assm.closingDate ? deadlineLabel(assm.closingDate) : 'No deadline'}
                     </span>
                   </div>
                   <ChevronRight size={16} className="deadline-arrow" />
                 </div>
               ))
             )}
          </div>
          {assessments.length > 3 && (
            <button className="view-all-btn" onClick={() => navigate('/app/exams')}>
              View all {assessments.length} assessments <ArrowRight size={14} />
            </button>
          )}
        </div>
      </section>

      {/* My Courses Section */}
      <section className="my-courses-section">
        <div className="section-header">
          <h2 className="section-title">
            <Activity size={20} />
            My Learning Journey
          </h2>
          <button className="view-all-link" onClick={() => navigate('/app/courses')}>
            View all courses <ArrowRight size={14} />
          </button>
        </div>
        <div className="courses-grid">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="course-card-skeleton">
                <Skeleton variant="rectangular" height={140} />
                <Skeleton variant="text" width="80%" height="24px" className="mt-3" />
                <Skeleton variant="rounded" height="8px" className="mt-2" />
                <Skeleton variant="text" width="40%" className="mt-2" />
              </div>
            ))
          ) : courses.length === 0 ? (
            <div className="empty-courses">
              <div className="empty-courses-icon">
                <BookOpen size={48} />
              </div>
              <h3>Start Your Learning Journey</h3>
              <p>Explore our catalog and enroll in courses to begin</p>
              <Button variant="primary" onClick={() => navigate('/app/discover')}>
                Discover Courses
              </Button>
            </div>
          ) : (
            courses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onContinue={(id) => navigate(`/app/courses/${id}/player`)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};
