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
  Flame, Clock, Calendar, AlertTriangle, BookOpen,
  Award, Zap, Target, ArrowRight, PlayCircle, ChevronRight, Sparkles,
  BarChart3, Trophy, Star, Activity, Shield, Swords, Crown, Gem,
  TrendingUp, CheckCircle2, Circle, Lock, Briefcase, Building2, XCircle
} from 'lucide-react';
import api from '../lib/api';
import './Dashboard.css';
import { InterviewBanner } from '../components/features/placements/InterviewBanner';
import type { InterviewSession } from '../components/features/placements/InterviewBanner';

/** Returns days until a given ISO date string (negative = overdue) */
function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

/** Format relative deadline label */
function deadlineLabel(dateStr: string): string {
  const d = daysUntil(dateStr);
  if (d < 0) return `OVERDUE ${Math.abs(d)}d`;
  if (d === 0) return 'DUE TODAY';
  return `T-${d}d`;
}

/** Calculate XP from courses and streak */
function calcXP(courses: any[], streakDays: number, examCount: number): number {
  const lectureXP = courses.reduce((acc, c) => acc + (c.lecturesCompleted ?? 0) * 100, 0);
  const examXP = examCount * 500;
  const streakXP = streakDays * 150;
  return lectureXP + examXP + streakXP;
}

/** Level from XP (1000 XP per level) */
function calcLevel(xp: number): { level: number; progress: number; nextLevelXP: number } {
  const level = Math.floor(xp / 1000) + 1;
  const currentLevelXP = (level - 1) * 1000;
  const nextLevelXP = level * 1000;
  const progress = Math.round(((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100);
  return { level, progress, nextLevelXP };
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'Novice', 2: 'Apprentice', 3: 'Scholar', 4: 'Adept', 5: 'Expert',
  6: 'Master', 7: 'Elite', 8: 'Legend', 9: 'Grandmaster', 10: 'Sage',
};

const LEVEL_COLORS: Record<number, string> = {
  1: '#94a3b8', 2: '#6ea8fe', 3: '#34d399', 4: '#f59e0b',
  5: '#f97316', 6: '#ef4444', 7: '#a855f7', 8: '#ec4899',
  9: '#06b6d4', 10: '#fbbf24',
};

function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, 10)] ?? 'Sage';
}

function getLevelColor(level: number): string {
  return LEVEL_COLORS[Math.min(level, 10)] ?? '#fbbf24';
}

const RANK_ICONS = [
  <Crown key={0} size={18} color="#fbbf24" />,
  <Trophy key={1} size={18} color="#94a3b8" />,
  <Award key={2} size={18} color="#cd7f32" />,
];

interface CountUpProps {
  end: number;
  duration?: number;
  formatter?: (val: number) => string;
}

const CountUp: React.FC<CountUpProps> = ({ end, duration = 800, formatter }) => {
  const [count, setCount] = React.useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // cubic-bezier ease-out curve
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + easedProgress * (end - startValue));

      setCount(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [end, duration]);

  return <>{formatter ? formatter(count) : count}</>;
};

interface BentoCardProps {
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

const BentoCard: React.FC<BentoCardProps> = ({ className = '', onClick, children }) => {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      className={`db-card-wrapper ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
    >
      <div className="db-card-inner">
        {children}
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  bg: string;
  isPercent?: boolean;
  isXP?: boolean;
  total?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  color,
  bg,
  isPercent,
  isXP,
  total,
}) => {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className="db-stat-card-wrapper" onMouseMove={handleMouseMove}>
      <div className="db-stat-card-inner">
        <div className="db-stat-icon" style={{ background: bg, color: color }}>
          {icon}
        </div>
        <div className="db-stat-info">
          <div className="db-stat-value" style={{ color: color }}>
            {isPercent ? (
              <CountUp end={value} formatter={(v) => `${v}%`} />
            ) : total !== undefined ? (
              <>
                <CountUp end={value} />
                <span className="db-stat-total">/{total}</span>
              </>
            ) : isXP ? (
              <CountUp end={value} formatter={(v) => v.toLocaleString()} />
            ) : (
              <CountUp end={value} />
            )}
          </div>
          <div className="db-stat-label">{label}</div>
        </div>
      </div>
    </div>
  );
};

interface PlacementCardProps {
  drive: any;
  onClick: () => void;
  getStepState: (idx: number) => 'completed' | 'failed' | 'active' | 'pending';
  steps: { label: string; key: string }[];
  currentStatus: string;
}

const PlacementCard: React.FC<PlacementCardProps> = ({
  drive,
  onClick,
  getStepState,
  steps,
  currentStatus,
}) => {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className="db-placement-card-wrapper" onMouseMove={handleMouseMove} onClick={onClick}>
      <div className="db-placement-card-inner">
        <div className="db-placement-card-header">
          <div className="db-placement-logo-wrap">
            <div className="db-placement-logo" style={{ backgroundColor: '#3b82f6' }}>
              {drive.companyName?.[0] || 'D'}
            </div>
          </div>
          <div className="db-placement-card-title-area">
            <h3 className="db-placement-company">{drive.companyName}</h3>
            <p className="db-placement-role">{drive.name || drive.targetRoles?.join(', ')}</p>
          </div>
          <div className="db-placement-badge-wrap">
            <Badge variant={currentStatus === 'selected' ? 'success' : currentStatus === 'rejected' ? 'danger' : currentStatus === 'interview' ? 'warning' : 'primary'} size="sm">
              {currentStatus.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="db-pipeline-tracker">
          <div className="db-pipeline-steps">
            {steps.map((step, idx) => {
              const state = getStepState(idx);
              const isLineActive = idx <= (currentStatus === 'rejected' ? 2 : (steps.findIndex(s => s.key === currentStatus) ?? 0));
              return (
                <React.Fragment key={step.key}>
                  {idx > 0 && (
                    <div className={`db-pipeline-line ${isLineActive ? 'active' : ''}`} />
                  )}
                  <div className={`db-pipeline-step ${state}`}>
                    <div className="db-pipeline-dot">
                      {state === 'completed' && <CheckCircle2 size={12} />}
                      {state === 'failed' && <XCircle size={12} />}
                      {state === 'active' && <Circle size={10} fill="currentColor" />}
                    </div>
                    <span className="db-pipeline-label">{step.label}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { courses, assessments, topLeaders, examCount, isLoading, fetchDashboardData } = useDashboardStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fetch streak from API
  const { data: streakData } = useQuery<{ currentStreak: number; bestStreak: number; freezeCredits: number; lastActiveDate?: string }>({
    queryKey: ['streak'],
    queryFn: async () => {
      const res = await api.get('/lms/streaks/me');
      const payload = res.data.data ?? res.data;
      if (typeof payload === 'object' && 'currentStreak' in payload) return payload;
      return { currentStreak: 0, bestStreak: 0, freezeCredits: 0 };
    },
    retry: false,
  });

  const currentStreak = streakData?.currentStreak ?? 0;
  const bestStreak = streakData?.bestStreak ?? 0;
  const freezeCredits = streakData?.freezeCredits ?? 0;
  const lastActiveDate = streakData?.lastActiveDate;

  // Fetch placement drives for the tracker
  const { data: drives = [], isLoading: isDrivesLoading } = useQuery<any[]>({
    queryKey: ['placement-drives-db'],
    queryFn: async () => {
      try {
        const res = await api.get('/placements/drives');
        return res.data.data?.drives ?? res.data.data ?? res.data ?? [];
      } catch (e) {
        return [];
      }
    },
    staleTime: 60_000,
  });

  // Fetch active interview sessions
  const { data: mySessions = [] } = useQuery<InterviewSession[]>({
    queryKey: ['my-interview-sessions-db', user?.id],
    queryFn: async () => {
      try {
        const res = await api.get('/placements/sessions?studentId=me&active=true');
        return res.data.data || res.data || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  const appliedDrives = useMemo(() => {
    return drives.filter((d: any) =>
      ['applied', 'shortlisted', 'interview', 'selected', 'rejected'].includes(d.status)
    );
  }, [drives]);

  // Compute which days of current week are active
  const streakDays = useMemo<boolean[]>(() => {
    // Get the Monday of this week
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    if (!lastActiveDate || currentStreak === 0) {
      return [false, false, false, false, false, false, false];
    }

    const dateStr = typeof lastActiveDate === 'string' ? lastActiveDate.split('T')[0] : '';
    if (!dateStr) {
      return [false, false, false, false, false, false, false];
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return [false, false, false, false, false, false, false];
    }

    const lastActive = new Date(year, month - 1, day);
    lastActive.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      if (dayDate > today) return false;

      // Mark active if within the streak window going back from lastActiveDate
      const diffMs = lastActive.getTime() - dayDate.getTime();
      const diffDays = Math.round(diffMs / 86400000);
      return diffDays >= 0 && diffDays < currentStreak;
    });
  }, [currentStreak, lastActiveDate]);

  // XP & Level
  const totalXP = useMemo(() => calcXP(courses, currentStreak, examCount), [courses, currentStreak, examCount]);
  const { level, progress: levelProgress } = useMemo(() => calcLevel(totalXP), [totalXP]);
  const levelColor = getLevelColor(level);
  const levelTitle = getLevelTitle(level);

  // Stats
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

  // Achievements
  const achievements = useMemo(() => [
    { id: 'novice', label: 'Enrolled', icon: <BookOpen size={18} />, unlocked: courses.length > 0, color: '#34d399', desc: 'Joined a course' },
    { id: 'scholar', label: 'Scholar', icon: <Star size={18} />, unlocked: overallProgress > 50, color: '#f59e0b', desc: '>50% avg progress' },
    { id: 'consistent', label: 'Consistent', icon: <Flame size={18} />, unlocked: currentStreak >= 3, color: '#ef4444', desc: '3-day streak' },
    { id: 'performer', label: 'Performer', icon: <Trophy size={18} />, unlocked: examCount > 0, color: '#a855f7', desc: 'Attempted an exam' },
    { id: 'completionist', label: 'Completionist', icon: <CheckCircle2 size={18} />, unlocked: completedCourses > 0, color: '#06b6d4', desc: 'Completed a course' },
    { id: 'legend', label: 'Legend', icon: <Crown size={18} />, unlocked: level >= 5, color: '#fbbf24', desc: 'Reached Level 5' },
  ], [courses.length, overallProgress, currentStreak, examCount, completedCourses, level]);

  // Quests
  const isActiveToday = useMemo(() => {
    if (!lastActiveDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return lastActiveDate === today;
  }, [lastActiveDate]);

  const quests = useMemo(() => [
    {
      id: 'daily-dev',
      label: 'Daily Dev',
      desc: 'Stay active today',
      icon: <Zap size={16} />,
      progress: isActiveToday ? 1 : 0,
      total: 1,
      xp: 150,
      color: '#f59e0b',
    },
    {
      id: 'knowledge-seeker',
      label: 'Knowledge Seeker',
      desc: 'Complete a lecture',
      icon: <BookOpen size={16} />,
      progress: Math.min(courses.reduce((a, c) => a + (c.lecturesCompleted ?? 0), 0), 1),
      total: 1,
      xp: 100,
      color: '#34d399',
    },
    {
      id: 'unstoppable',
      label: 'Unstoppable',
      desc: 'Reach a 3-day streak',
      icon: <Flame size={16} />,
      progress: Math.min(currentStreak, 3),
      total: 3,
      xp: 300,
      color: '#ef4444',
    },
  ], [isActiveToday, courses, currentStreak]);

  const nextExam = assessments[0];

  return (
    <div className="dashboard-content">
      <InterviewBanner 
        sessions={mySessions} 
        onJoin={(sessionId) => navigate(`/app/placements/interview/${sessionId}`)} 
      />

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="db-header">
        <div className="db-welcome">
          <div className="db-badge">
            <Sparkles size={13} /> Learning Overview
          </div>
          <h1 className="db-title">
            Welcome back, <span className="db-name">{user?.fullName?.split(' ')[0] || 'Student'}</span>
          </h1>
          <p className="db-subtitle">
            Your learning, assessment, and placement readiness in one focused workspace.
          </p>
        </div>
        <div className="db-header-actions">
          <Button variant="primary" size="sm" leftIcon={<PlayCircle size={16} />} onClick={() => navigate('/app/discover')}>
            Explore Courses
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Target size={16} />} onClick={() => navigate('/app/placements')}>
            Placements
          </Button>
        </div>
      </header>

      {/* ── Redesigned Unified Layout Grid ───────────────────── */}
      <div className="db-layout-grid">
        
        {/* ── Main Column (65%) ── */}
        <div className="db-main-col">
          
          {/* Sleek Horizontal Stats Banner */}
          <div className="db-stats-banner">
            <div className="db-stat-item-premium">
              <span className="db-stat-label-prem">Progress</span>
              <div className="db-stat-value-prem text-emerald-400">
                <CountUp end={overallProgress} formatter={(v) => `${v}%`} />
              </div>
            </div>
            <div className="db-stat-divider" />
            <div className="db-stat-item-premium">
              <span className="db-stat-label-prem">Courses Done</span>
              <div className="db-stat-value-prem text-blue-400">
                <CountUp end={completedCourses} />
                <span className="db-stat-total-prem">/{courses.length}</span>
              </div>
            </div>
            <div className="db-stat-divider" />
            <div className="db-stat-item-premium">
              <span className="db-stat-label-prem">Exams Due</span>
              <div className="db-stat-value-prem text-amber-500">
                <CountUp end={upcomingDeadlines} />
              </div>
            </div>
            <div className="db-stat-divider" />
            <div className="db-stat-item-premium">
              <span className="db-stat-label-prem">Readiness XP</span>
              <div className="db-stat-value-prem text-indigo-400">
                <CountUp end={totalXP} formatter={(v) => v.toLocaleString()} />
              </div>
            </div>
          </div>

          {/* Continue Learning Card */}
          <BentoCard className="db-continue-learning-hero">
            <div className="db-continue-hero-inner">
              <div className="db-continue-title-bar">
                <Zap size={15} className="text-yellow-500" />
                <span className="font-mono text-[10px] tracking-widest uppercase">RESUME CURRENT COURSE</span>
              </div>
              
              {isLoading ? (
                <Skeleton variant="rectangular" height={120} />
              ) : courses.length > 0 ? (
                <div className="db-continue-hero-body">
                  <div className="db-continue-hero-thumb">
                    {courses[0].thumbnail
                      ? <img src={courses[0].thumbnail} alt={courses[0].title} />
                      : <div className="db-course-thumb-placeholder"><BookOpen size={24} color="#6366f1" /></div>
                    }
                  </div>
                  <div className="db-continue-hero-info">
                    <h3 className="db-continue-hero-title font-serif">{courses[0].title}</h3>
                    <p className="db-continue-hero-meta">by {courses[0].instructor} · {courses[0].lecturesCompleted ?? 0}/{courses[0].totalLectures ?? '?'} lectures</p>
                    <div className="db-continue-progress-row">
                      <div className="db-continue-progress-bar">
                        <div className="db-continue-progress-fill" style={{ width: `${courses[0].progress ?? 0}%` }} />
                      </div>
                      <span className="db-continue-progress-pct font-mono">{courses[0].progress ?? 0}%</span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/app/courses/${courses[0].id}/player`)}
                      rightIcon={<ArrowRight size={14} />}
                    >
                      Resume Learning
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="db-continue-empty">
                  <BookOpen size={32} className="text-slate-600 mb-2" />
                  <p className="text-sm text-slate-400 mb-3">No active courses yet. Start your journey!</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/app/discover')}>Explore Catalog</Button>
                </div>
              )}
            </div>
          </BentoCard>


          {/* Active Courses */}
          <section className="db-courses-section">
            <div className="db-section-header">
              <h2 className="db-section-title font-serif">
                <Activity size={16} className="text-emerald-400" /> Active Enrolled Courses
              </h2>
              <button className="db-link-btn" onClick={() => navigate('/app/courses')}>
                All →
              </button>
            </div>
            <div className="db-courses-grid">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="db-course-skeleton">
                    <Skeleton variant="rectangular" height={120} />
                  </div>
                ))
              ) : courses.length === 0 ? (
                <div className="db-empty-courses">
                  <p className="text-slate-400 text-sm mb-3">No enrolled courses yet.</p>
                  <Button variant="primary" onClick={() => navigate('/app/discover')}>Discover Courses</Button>
                </div>
              ) : (
                courses.slice(0, 2).map(course => (
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

        {/* ── Sidebar Column (35%) ── */}
        <div className="db-sidebar-col">
          
          {/* RPG-Inspired Gamification Hub */}
          <div className="db-rpg-card">
            <div className="db-rpg-header">
              <div className="db-rpg-level-badge" style={{ background: `${levelColor}22`, borderColor: `${levelColor}55`, color: levelColor }}>
                <span className="font-mono text-xs tracking-wider">LEVEL</span>
                <span className="db-rpg-level-number font-serif"><CountUp end={level} /></span>
              </div>
              <div className="db-rpg-profile">
                <div className="db-rpg-title font-serif">{levelTitle}</div>
                <div className="db-rpg-subtitle font-mono text-[9px] tracking-widest text-slate-500">READINESS RANK</div>
              </div>
            </div>

            <div className="db-rpg-xp-section">
              <div className="db-rpg-xp-bar-labels font-mono text-[9px] tracking-wider text-slate-400">
                <span>XP PROGRESS</span>
                <span>{totalXP % 1000} / 1000 XP</span>
              </div>
              <div className="db-rpg-xp-track">
                <div className="db-rpg-xp-fill" style={{ width: `${levelProgress}%`, background: `linear-gradient(90deg, ${levelColor}aa, ${levelColor})` }} />
              </div>
            </div>

            <div className="db-rpg-divider" />

            {/* Streak Calendar in Gamification Hub */}
            <div className="db-rpg-streak-title">
              <Flame size={14} className="text-rose-500" />
              <span className="font-mono text-[10px] tracking-widest uppercase">WEEKLY STREAK · {currentStreak}d</span>
            </div>
            <div className="db-streak-calendar">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className={`db-streak-day ${streakDays[i] ? 'active' : ''}`}>
                  <div className="db-streak-bar">
                    {streakDays[i] && <div className="db-streak-glow" />}
                  </div>
                  <span className="db-streak-lbl">{d}</span>
                </div>
              ))}
            </div>
            
            <div className="db-rpg-streak-stats font-mono text-[9px] tracking-wider text-slate-400">
              <span>Best: <strong>{bestStreak}d</strong></span>
              <span>Freezes: <strong>{freezeCredits}</strong></span>
            </div>
          </div>

          {/* Daily Quests */}
          <div className="db-quests-card">
            <div className="db-card-section-title font-mono text-[10px] tracking-widest uppercase text-slate-400 mb-3">
              <Target size={12} className="text-purple-400 inline-block mr-1.5 align-text-bottom" />
              DAILY QUESTS
            </div>
            <div className="db-quest-list">
              {quests.map(q => {
                const done = q.progress >= q.total;
                const pct = Math.round((q.progress / q.total) * 100);
                return (
                  <div key={q.id} className={`db-quest-item ${done ? 'done' : ''}`}>
                    <div className="db-quest-icon-prem" style={{ color: q.color, background: `${q.color}15` }}>
                      {done ? <CheckCircle2 size={13} /> : q.icon}
                    </div>
                    <div className="db-quest-body">
                      <div className="db-quest-header">
                        <span className="db-quest-label font-serif">{q.label}</span>
                        <span className="db-quest-xp font-mono text-[9px]" style={{ color: q.color }}>+{q.xp} XP</span>
                      </div>
                      <div className="db-quest-desc">{q.desc}</div>
                      <div className="db-quest-bar-track">
                        <div className="db-quest-bar-fill" style={{ width: `${pct}%`, background: q.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="db-exams-card">
            <div className="db-card-section-title font-mono text-[10px] tracking-widest uppercase text-slate-400 mb-3">
              <Calendar size={12} className="text-amber-500 inline-block mr-1.5 align-text-bottom" />
              UPCOMING EXAMS
            </div>
            <div className="db-deadlines-list">
              {isLoading ? (
                <Skeleton variant="rectangular" height={80} />
              ) : assessments.length === 0 ? (
                <div className="db-empty-state-sidebar font-mono text-[10px] text-slate-500">
                  No upcoming exams.
                </div>
              ) : (
                assessments.slice(0, 3).map(assm => {
                  const days = assm.closingDate ? daysUntil(assm.closingDate) : null;
                  const urgent = days !== null && days <= 2;
                  return (
                    <div key={assm.id} className={`db-deadline-item ${days !== null && days < 0 ? 'overdue' : ''} ${urgent ? 'urgent' : ''}`} onClick={() => navigate('/app/exams')}>
                      <div className="db-deadline-icon">
                        <Calendar size={12} />
                      </div>
                      <div className="db-deadline-info">
                        <span className="db-deadline-title">{assm.title}</span>
                        <span className={`db-deadline-date ${urgent ? 'urgent' : ''}`}>
                          {assm.closingDate ? deadlineLabel(assm.closingDate) : 'No date'}
                        </span>
                      </div>
                      <ChevronRight size={12} className="db-deadline-arrow" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
