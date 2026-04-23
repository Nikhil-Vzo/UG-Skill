import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDashboardStore } from '../store/dashboard.store';
import { useAuthStore } from '../store/auth.store';
import { Skeleton } from '../components/loaders/Skeleton';
import { CourseCard } from '../components/features/course/CourseCard';
import { Flame, Clock, Calendar, AlertTriangle } from 'lucide-react';
import api from '../lib/api';

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
      return res.data.data ?? [];
    },
    // Silently fail — streaks are non-critical
    retry: false,
  });

  // 7-slot streak array: use API result or fallback to all-false
  const streakDays: boolean[] = streakData?.length === 7
    ? streakData
    : [false, false, false, false, false, false, false];

  const activeDays = streakDays.filter(Boolean).length;

  return (
    <div className="dashboard-content flex flex-col gap-8" style={{ padding: '2rem' }}>
      {error && (
        <div style={{ backgroundColor: 'var(--error-container)', color: 'var(--on-error-container)', padding: '1rem', borderRadius: '0px', marginBottom: '1rem', borderLeft: '4px solid var(--error)' }}>
          <strong>System Alert: </strong>{error}
        </div>
      )}
      <header>
        <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-high)' }}>
          Welcome back, {user?.fullName || 'Initiate'}.
        </h1>
        <p style={{ color: 'var(--text-low)' }}>
          Your cognitive development matrix is online. System tracking active.
        </p>
      </header>

      {/* Widgets Top Row */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Streak Calendar Widget */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ color: 'var(--text-high)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Flame color="var(--primary-glow)" size={20} />
              <span>Activity Matrix</span>
            </h3>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-high)' }}>
              {activeDays}<span style={{ fontSize: '1rem', color: 'var(--text-low)', fontWeight: 'normal' }}> DAYS</span>
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginTop: 'auto' }}>
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ 
                  width: '100%', height: '30px', 
                  backgroundColor: streakDays[i] ? 'var(--primary-glow)' : 'var(--surface-well)',
                  opacity: streakDays[i] ? 0.8 : 0.3,
                  boxShadow: streakDays[i] ? '0 0 10px var(--primary-glow)' : 'none'
                }} />
                <span style={{ fontSize: '0.625rem', color: 'var(--text-low)', fontWeight: 600 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Streams Widget */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ color: 'var(--text-high)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Clock color="var(--success)" size={20} />
            <span>Active Stream</span>
          </h3>
          <div className="surface-well" style={{ padding: '1rem', marginTop: 'auto' }}>
            {isLoading ? (
               <Skeleton variant="text" width="80%" />
            ) : courses.length > 0 ? (
               <>
                 <span style={{ color: 'var(--text-high)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>{courses[0].title}</span>
                 <div style={{ width: '100%', backgroundColor: 'var(--surface-highest)', height: '4px', marginTop: '0.5rem' }}>
                   <div style={{ width: `${courses[0].progress ?? 0}%`, backgroundColor: 'var(--success)', height: '100%' }} />
                 </div>
                 <span style={{ fontSize: '0.75rem', color: 'var(--text-low)', marginTop: '0.25rem', display: 'block' }}>{courses[0].progress ?? 0}% Synchronized</span>
                 <button
                   onClick={() => navigate(`/courses/${courses[0].id}/player`)}
                   style={{ marginTop: '0.75rem', background: 'none', border: '1px solid var(--success)', color: 'var(--success)', padding: '0.375rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                 >
                   Resume →
                 </button>
               </>
            ) : (
               <span style={{ color: 'var(--text-low)', fontSize: '0.875rem' }}>No active streams detected.</span>
            )}
          </div>
        </div>

        {/* Missing/Upcoming Assignments Widget */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '2px solid var(--warning)' }}>
          <h3 style={{ color: 'var(--text-high)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <AlertTriangle color="var(--warning)" size={20} />
            <span>Pending Requirements</span>
          </h3>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             {isLoading ? (
               <Skeleton variant="rectangular" height={60} />
             ) : assessments.length === 0 ? (
               <div className="surface-well" style={{ padding: '1rem', textAlign: 'center' }}>
                 <span style={{ color: 'var(--text-low)', fontSize: '0.875rem' }}>All protocols complete.</span>
               </div>
             ) : (
               assessments.slice(0, 2).map(assm => (
                 <div key={assm.id} className="surface-well" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <span style={{ color: 'var(--text-high)', fontSize: '0.875rem', fontWeight: 600, display: 'block' }}>{assm.title}</span>
                     <span style={{ color: 'var(--warning)', fontSize: '0.625rem', textTransform: 'uppercase' }}>
                       {assm.closingDate ? deadlineLabel(assm.closingDate) : 'DEADLINE TBD'}
                     </span>
                   </div>
                   <Calendar size={16} color="var(--text-low)" />
                 </div>
               ))
             )}
          </div>
        </div>
      </section>

      {/* Continuation Matrix */}
      <section>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-high)', marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>Module Continuation Matrix</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="surface-card" style={{ padding: '1.5rem' }}>
                <Skeleton variant="text" width="80%" height="24px" className="mb-4" />
                <Skeleton variant="rounded" height="8px" className="mb-2" />
                <Skeleton variant="text" width="40%" />
              </div>
            ))
          ) : (
            courses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onContinue={(id) => navigate(`/courses/${id}/player`)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};
