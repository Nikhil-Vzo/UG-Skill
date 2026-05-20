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
  TrendingUp, CheckCircle2, Circle, Lock
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

  const activeDays = streakDays.filter(Boolean).length;

  // XP & Level
  const totalXP = useMemo(() => calcXP(courses, currentStreak, examCount), [courses, currentStreak, examCount]);
  const { level, progress: levelProgress, nextLevelXP } = useMemo(() => calcLevel(totalXP), [totalXP]);
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

      {/* ── XP Level Bar ───────────────────────────────────── */}
      <div className="db-xp-bar-wrapper">
        <div className="db-xp-left">
          <div className="db-level-badge" style={{ background: `${levelColor}22`, borderColor: `${levelColor}55`, color: levelColor }}>
            <Shield size={14} />
            <span>Lvl {level}</span>
          </div>
          <span className="db-xp-label">{levelTitle}</span>
        </div>
        <div className="db-xp-track">
          <div className="db-xp-fill" style={{ width: `${levelProgress}%`, background: `linear-gradient(90deg, ${levelColor}aa, ${levelColor})`, boxShadow: `0 0 12px ${levelColor}66` }} />
        </div>
        <div className="db-xp-right">
          <span className="db-xp-label">{totalXP % 1000}<span style={{ color: '#737373' }}>/{1000} XP</span></span>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <section className="db-stats">
        {[
          { icon: <BarChart3 size={20} />, value: `${overallProgress}%`, label: 'Learning Progress', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { icon: <BookOpen size={20} />, value: `${completedCourses}/${courses.length}`, label: 'Courses Completed', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
          { icon: <AlertTriangle size={20} />, value: upcomingDeadlines, label: 'Priority Exams', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { icon: <Flame size={20} />, value: currentStreak, label: 'Active Streak', color: '#fb7185', bg: 'rgba(251,113,133,0.1)' },
          { icon: <Gem size={20} />, value: `${totalXP.toLocaleString()}`, label: 'Readiness XP', color: levelColor, bg: `${levelColor}18` },
        ].map((s, i) => (
          <div key={i} className="db-stat-card">
            <div className="db-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <div className="db-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="db-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Main Widgets Grid ──────────────────────────────── */}
      <section className="db-grid">

        {/* Streak Calendar */}
        <div className="db-panel db-streak-panel">
          <div className="db-panel-header">
            <div className="db-panel-title"><Flame size={18} color="#ef4444" /> Activity Streak</div>
            <Badge variant={currentStreak >= 7 ? 'success' : currentStreak >= 3 ? 'warning' : 'default'} size="sm">
              {currentStreak >= 7 ? 'Perfect week' : currentStreak >= 3 ? `${currentStreak} day streak` : `${currentStreak} days`}
            </Badge>
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
          <div className="db-streak-meta">
            <div className="db-streak-meta-item">
              <Flame size={14} color="#ef4444" />
              <span>Current: <strong style={{ color: '#ef4444' }}>{currentStreak}</strong></span>
            </div>
            <div className="db-streak-meta-item">
              <Star size={14} color="#f59e0b" />
              <span>Best: <strong style={{ color: '#f59e0b' }}>{bestStreak}</strong></span>
            </div>
            <div className="db-streak-meta-item">
              <Shield size={14} color="#6366f1" />
              <span>Freezes: <strong style={{ color: '#6366f1' }}>{freezeCredits}</strong></span>
            </div>
          </div>
          <div className="db-streak-msg">
            {currentStreak === 0 ? 'Start a focused study session today.' :
             currentStreak < 3 ? 'Good start. Build consistency this week.' :
             currentStreak < 7 ? 'Strong momentum. Keep the streak active.' : 'Perfect week. Keep protecting the routine.'}
          </div>
        </div>

        {/* Quest Log */}
        <div className="db-panel db-quests-panel">
          <div className="db-panel-header">
            <div className="db-panel-title"><Swords size={18} color="#a855f7" /> Daily Quests</div>
            <Badge variant="default" size="sm">+XP</Badge>
          </div>
          <div className="db-quest-list">
            {quests.map(q => {
              const done = q.progress >= q.total;
              const pct = Math.round((q.progress / q.total) * 100);
              return (
                <div key={q.id} className={`db-quest-item ${done ? 'done' : ''}`}>
                  <div className="db-quest-icon" style={{ color: q.color, background: `${q.color}18` }}>
                    {done ? <CheckCircle2 size={16} /> : q.icon}
                  </div>
                  <div className="db-quest-body">
                    <div className="db-quest-header">
                      <span className="db-quest-label">{q.label}</span>
                      <span className="db-quest-xp" style={{ color: q.color }}>+{q.xp} XP</span>
                    </div>
                    <div className="db-quest-desc">{q.desc}</div>
                    <div className="db-quest-bar-track">
                      <div className="db-quest-bar-fill" style={{ width: `${pct}%`, background: q.color, boxShadow: done ? `0 0 8px ${q.color}88` : 'none' }} />
                    </div>
                  </div>
                  <div className="db-quest-count">{q.progress}/{q.total}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Continue Learning */}
        <div className="db-panel db-continue-panel">
          <div className="db-panel-header">
            <div className="db-panel-title"><Zap size={18} color="#f59e0b" /> Continue Learning</div>
          </div>
          <div className="db-continue-body">
            {isLoading ? (
              <Skeleton variant="rectangular" height={120} />
            ) : courses.length > 0 ? (
              <>
                <div className="db-course-resume-thumb">
                  {courses[0].thumbnail
                    ? <img src={courses[0].thumbnail} alt={courses[0].title} className="db-course-thumb-img" />
                    : <div className="db-course-thumb-placeholder"><BookOpen size={32} color="#6366f1" /></div>
                  }
                </div>
                <div className="db-course-resume-info">
                  <h4 className="db-course-title">{courses[0].title}</h4>
                  <p className="db-course-instructor">by {courses[0].instructor}</p>
                  <div className="db-progress-row">
                    <span className="db-progress-pct">{courses[0].progress ?? 0}%</span>
                    <span className="db-progress-modules">{courses[0].lecturesCompleted ?? 0}/{courses[0].totalLectures ?? '?'} lectures</span>
                  </div>
                  <div className="db-progress-track">
                    <div className="db-progress-fill" style={{ width: `${courses[0].progress ?? 0}%` }} />
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="db-resume-btn"
                    rightIcon={<ArrowRight size={14} />}
                    onClick={() => navigate(`/app/courses/${courses[0].id}/player`)}
                  >
                    Resume
                  </Button>
                </div>
              </>
            ) : (
              <div className="db-empty-state">
                <BookOpen size={36} color="#6366f155" />
                <span>No active courses yet</span>
                <Button variant="outline" size="sm" onClick={() => navigate('/app/discover')}>Browse Courses</Button>
              </div>
            )}
          </div>
        </div>

        {/* Deadlines */}
        <div className="db-panel db-deadlines-panel">
          <div className="db-panel-header">
            <div className="db-panel-title"><AlertTriangle size={18} color="#f59e0b" /> Upcoming Exams</div>
            {upcomingDeadlines > 0 && <Badge variant="warning" size="sm">{upcomingDeadlines} due soon</Badge>}
          </div>
          <div className="db-deadlines-list">
            {isLoading ? (
              <Skeleton variant="rectangular" height={100} />
            ) : assessments.length === 0 ? (
              <div className="db-empty-state">
                <Trophy size={32} color="#34d39955" />
                <span>No exams due right now</span>
                <p style={{ color: '#737373', fontSize: '0.8rem', margin: 0 }}>No upcoming exams</p>
              </div>
            ) : (
              assessments.slice(0, 4).map(assm => {
                const days = assm.closingDate ? daysUntil(assm.closingDate) : null;
                const urgent = days !== null && days <= 2;
                return (
                  <div key={assm.id} className={`db-deadline-item ${days !== null && days < 0 ? 'overdue' : ''} ${urgent ? 'urgent' : ''}`}>
                    <div className="db-deadline-icon">
                      <Calendar size={14} />
                    </div>
                    <div className="db-deadline-info">
                      <span className="db-deadline-title">{assm.title}</span>
                      <span className={`db-deadline-date ${urgent ? 'urgent' : ''}`}>
                        {assm.closingDate ? deadlineLabel(assm.closingDate) : 'No date'}
                      </span>
                    </div>
                    <ChevronRight size={14} className="db-deadline-arrow" />
                  </div>
                );
              })
            )}
          </div>
          {assessments.length > 4 && (
            <button className="db-view-all" onClick={() => navigate('/app/exams')}>
              View all {assessments.length} exams <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* Mini Leaderboard */}
        <div className="db-panel db-leaderboard-panel">
          <div className="db-panel-header">
            <div className="db-panel-title"><Crown size={18} color="#fbbf24" /> Top Performers</div>
            <button className="db-link-btn" onClick={() => navigate('/app/leaderboards')}>
              See all <ChevronRight size={13} />
            </button>
          </div>
          <div className="db-leaders-list">
            {topLeaders.length === 0 ? (
              <div className="db-empty-state" style={{ padding: '1rem' }}>
                <Trophy size={28} color="#fbbf2444" />
                <span style={{ fontSize: '0.85rem', color: '#737373' }}>No rankings yet</span>
              </div>
            ) : topLeaders.map((leader, i) => (
              <div key={leader.studentId} className={`db-leader-item rank-${i + 1}`}>
                <div className="db-leader-rank">{RANK_ICONS[i]}</div>
                <div className="db-leader-info">
                  <span className="db-leader-name">{leader.name}</span>
                  <span className="db-leader-score">{leader.score.toLocaleString()} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="db-panel db-achievements-panel">
          <div className="db-panel-header">
            <div className="db-panel-title"><Award size={18} color="#f59e0b" /> Achievements</div>
            <span className="db-ach-count">{achievements.filter(a => a.unlocked).length}/{achievements.length}</span>
          </div>
          <div className="db-achievements-grid">
            {achievements.map(ach => (
              <div key={ach.id} className={`db-achievement ${ach.unlocked ? 'unlocked' : 'locked'}`} title={ach.desc} style={ach.unlocked ? { '--ach-color': ach.color } as any : {}}>
                <div className="db-ach-icon" style={ach.unlocked ? { background: `${ach.color}22`, color: ach.color, boxShadow: `0 0 14px ${ach.color}44` } : {}}>
                  {ach.unlocked ? ach.icon : <Lock size={16} />}
                </div>
                <span className="db-ach-label">{ach.label}</span>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ── My Courses ─────────────────────────────────────── */}
      <section className="db-courses-section">
        <div className="db-section-header">
          <h2 className="db-section-title">
            <Activity size={20} color="#60a5fa" /> Active Courses
          </h2>
          {nextExam && <span className="db-next-exam">Next exam: {nextExam.title}</span>}
          <button className="db-link-btn" onClick={() => navigate('/app/courses')}>
            All courses <ArrowRight size={14} />
          </button>
        </div>
        <div className="db-courses-grid">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="db-course-skeleton">
                <Skeleton variant="rectangular" height={140} />
                <Skeleton variant="text" width="80%" height="22px" className="mt-3" />
                <Skeleton variant="rounded" height="8px" className="mt-2" />
                <Skeleton variant="text" width="40%" className="mt-2" />
              </div>
            ))
          ) : courses.length === 0 ? (
            <div className="db-empty-courses">
              <div className="db-empty-courses-icon"><BookOpen size={48} color="#6366f133" /></div>
              <h3>Start Your Learning Journey</h3>
              <p>Explore our catalog and enroll in courses to begin</p>
              <Button variant="primary" onClick={() => navigate('/app/discover')}>Discover Courses</Button>
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
