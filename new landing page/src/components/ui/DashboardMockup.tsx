'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen,
  TrendingUp,
  Award,
  Activity,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowUpRight,
  Zap,
  Flame,
  ChevronRight,
  Lock,
  RefreshCw,
  MoreHorizontal,
  Bell,
  Search,
  Star,
  Target,
  Clock,
  Users,
  MousePointer2
} from 'lucide-react';

// Custom hook for intersection observer
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

export const DashboardMockup: React.FC = () => {
  const { ref: containerRef, isInView } = useInView(0.15);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');
  const [hoveredJob, setHoveredJob] = useState<number | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedMatch, setAnimatedMatch] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [cardTilts, setCardTilts] = useState<{ [key: number]: { x: number, y: number } }>({});

  // Trigger animations ONLY when scrolled into view
  useEffect(() => {
    if (isInView && !isLoaded) {
      setIsLoaded(true);
    }
  }, [isInView, isLoaded]);

  // Animated counters
  useEffect(() => {
    if (!isLoaded) return;
    const duration = 2200;
    const steps = 80;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const easeOutQuart = 1 - Math.pow(1 - step / steps, 4);
      setAnimatedScore(Math.round(87 * easeOutQuart));
      setAnimatedMatch(Math.round(94 * easeOutQuart));
      setAnimatedProgress(Math.round(65 * easeOutQuart));
      if (step >= steps) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [isLoaded]);

  // Global 3D tilt
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePos({ x: x * 15, y: y * -15 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [containerRef]);

  // Magnetic card tilt handler
  const handleCardMouseMove = useCallback((e: React.MouseEvent, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCardTilts(prev => ({ ...prev, [index]: { x: x * 12, y: y * -12 } }));
  }, []);

  const handleCardMouseLeave = useCallback((index: number) => {
    setCardTilts(prev => ({ ...prev, [index]: { x: 0, y: 0 } }));
  }, []);

  const tabs = [
    { id: 'courses', icon: BookOpen, label: 'Courses' },
    { id: 'leaderboard', icon: Award, label: 'Leaderboard' },
    { id: 'live', icon: Activity, label: 'Live GD' },
    { id: 'interviews', icon: TrendingUp, label: 'AI Interviews' },
  ];

  const badges = [
    { label: 'LMS Path Validated', delay: 0.6 },
    { label: 'Proctored Exam Passed', delay: 0.7 },
    { label: 'Live GD Rooms Rated A+', delay: 0.8 },
    { label: 'AI Mock Interview Room A', delay: 0.9 },
  ];

  const jobs = [
    { company: 'Stripe Inc.', role: 'Software Dev Intern', match: 94, color: 'from-sky-400 to-indigo-600', letter: 'S', delay: 1.0 },
    { company: 'Vercel', role: 'Frontend Engineer', match: 91, color: 'from-slate-700 to-slate-900', letter: 'V', delay: 1.1 },
    { company: 'Notion', role: 'Product Design Intern', match: 88, color: 'from-red-400 to-rose-600', letter: 'N', delay: 1.2 },
  ];

  const stats = [
    { label: 'Study Time', value: '24h', icon: Clock, color: 'from-blue-500 to-indigo-600', delay: 0.8 },
    { label: 'Avg Score', value: '92%', icon: Star, color: 'from-amber-500 to-orange-600', delay: 0.9 },
    { label: 'Rank', value: '#4', icon: Users, color: 'from-violet-500 to-purple-600', delay: 1.0 },
  ];

  return (
    <div className="w-full flex justify-center p-6 antialiased" style={{ perspective: 2000 }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(10px) rotate(-1deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        @keyframes orbit-slow {
          0% { transform: rotate(0deg) translateX(50px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(50px) rotate(-360deg); }
        }
        @keyframes orbit-slower {
          0% { transform: rotate(0deg) translateX(70px) rotate(0deg); }
          100% { transform: rotate(-360deg) translateX(70px) rotate(360deg); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes draw-circle {
          from { stroke-dashoffset: 201; }
          to { stroke-dashoffset: ${201 - (201 * 87) / 100}; }
        }
        @keyframes progress-fill {
          from { width: 0%; }
          to { width: 65%; }
        }
        @keyframes border-dance {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 10s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-orbit-slow { animation: orbit-slow 25s linear infinite; }
        .animate-orbit-slower { animation: orbit-slower 30s linear infinite; }
        .animate-slide-in { animation: slideInUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-in { animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-draw-circle { animation: draw-circle 2s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards; }
        .animate-progress { animation: progress-fill 2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards; }
        .animate-bounce-subtle { animation: bounce-subtle 2.5s ease-in-out infinite; }
        
        .shine-hover {
          position: relative;
          overflow: hidden;
        }
        .shine-hover::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: translateX(-100%) skewX(-15deg);
          transition: none;
        }
        .shine-hover:hover::after {
          animation: shimmer-sweep 0.8s ease-out;
        }
        
        .glass-edge {
          box-shadow: 
            inset 0 1px 1px rgba(255,255,255,0.6),
            inset 0 -1px 1px rgba(0,0,0,0.05),
            0 4px 6px -1px rgba(0,0,0,0.05);
        }
        
        .depth-shadow-back {
          box-shadow: 
            0 4px 6px -1px rgba(15,23,42,0.03),
            0 10px 15px -3px rgba(15,23,42,0.04),
            0 20px 25px -5px rgba(15,23,42,0.03);
        }
        
        .depth-shadow-front {
          box-shadow: 
            0 10px 15px -3px rgba(15,23,42,0.08),
            0 20px 30px -5px rgba(15,23,42,0.12),
            0 30px 60px -10px rgba(15,23,42,0.15),
            0 0 0 1px rgba(15,23,42,0.05);
        }
      `}</style>

      <div
        ref={containerRef}
        className="w-full max-w-5xl border border-slate-300/70 bg-slate-100 rounded-[2rem] overflow-hidden p-[3px] will-change-transform"
        style={{
          transform: `rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
          transition: 'transform 0.15s ease-out',
          transformStyle: 'preserve-3d',
          boxShadow: '0 40px 80px -20px rgba(15,23,42,0.2), 0 0 0 1px rgba(15,23,42,0.08)'
        }}
      >
        {/* Browser Chrome */}
        <div
          className="flex items-center justify-between px-6 py-3.5 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 select-none glass-edge"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(-30px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 rounded-full bg-[#FF5F57] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)] hover:brightness-90 transition-all cursor-pointer" />
            <span className="h-3.5 w-3.5 rounded-full bg-[#FEBC2E] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)] hover:brightness-90 transition-all cursor-pointer" />
            <span className="h-3.5 w-3.5 rounded-full bg-[#28C840] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)] hover:brightness-90 transition-all cursor-pointer" />
          </div>

          <div className="flex-1 max-w-xl mx-auto bg-slate-50/90 border border-slate-200/80 rounded-lg py-1.5 px-4 flex items-center justify-between text-xs shadow-inner">
            <div className="flex items-center gap-2 truncate">
              <Lock className="h-3 w-3 text-emerald-600" />
              <span className="text-[11px] text-slate-700 font-semibold truncate tracking-tight">ugskill.com/sandbox/dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <Star className="h-3 w-3 text-slate-300 hover:text-amber-400 hover:fill-amber-400 transition-all duration-300 cursor-pointer hover:scale-110" />
              <RefreshCw className="h-3 w-3 text-slate-400 hover:text-slate-600 transition-all duration-500 cursor-pointer hover:rotate-180" />
            </div>
          </div>

          <div className="w-20 flex items-center justify-end gap-3">
            <div className="relative">
              <Bell className="h-4 w-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer hover:scale-110" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full border border-white" />
            </div>
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-bold text-white flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer ring-2 ring-white">
              JD
            </div>
          </div>
        </div>

        {/* Main Viewport */}
        <div
          className="relative w-full aspect-[16/10] bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8 overflow-hidden rounded-b-[2rem]"
          style={{ transformStyle: 'preserve-3d', perspective: 1500, perspectiveOrigin: '50% 50%' }}
        >
          {/* Ultra-sharp Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, slategray 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }} />
            <div className="absolute -top-24 -left-24 h-96 w-96 bg-emerald-400/8 rounded-full blur-3xl animate-float" />
            <div className="absolute -bottom-24 -right-24 h-96 w-96 bg-sky-400/8 rounded-full blur-3xl animate-float-reverse" />
            <div className="absolute top-1/3 left-1/2 h-48 w-48 bg-violet-400/5 rounded-full blur-3xl animate-float" style={{ transform: 'translate(-50%, -50%)' }} />

            {/* Sharp orbiting elements */}
            <div className="absolute top-1/2 left-1/3 h-2 w-2 bg-emerald-400/50 rounded-full animate-orbit-slow shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
            <div className="absolute top-1/3 right-1/3 h-1.5 w-1.5 bg-sky-400/50 rounded-full animate-orbit-slower shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
          </div>

          {/* DEPTH BRIDGE: Visual connector between layers */}
          <div
            className="absolute top-1/2 left-[35%] w-[30%] h-[2px] bg-gradient-to-r from-transparent via-slate-300/40 to-transparent z-0"
            style={{
              transform: 'translateZ(25px) rotateX(60deg)',
              opacity: isLoaded ? 0.6 : 0,
              transition: 'opacity 1.5s ease 1s'
            }}
          />

          {/* LAYER 1: LMS Dashboard (Background, deeper Z) */}
          <div
            className="absolute top-8 left-8 w-[68%] h-[84%] rounded-2xl border border-slate-200/90 bg-white/98 backdrop-blur-sm p-6 depth-shadow-back z-0 overflow-hidden group"
            style={{
              transform: isLoaded ? 'translate3d(-25px, -20px, -40px) rotateY(3deg)' : 'translate3d(-25px, -20px, -100px) rotateY(8deg)',
              opacity: isLoaded ? 1 : 0,
              transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
              transformStyle: 'preserve-3d',
              willChange: 'transform, opacity'
            }}
          >
            {/* Inner glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 via-emerald-50/0 to-emerald-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200/50 ring-1 ring-emerald-500/20">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 tracking-[0.15em] uppercase">LMS Dashboard</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700">Unit 3 Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/60 rounded-full px-3 py-1.5 shadow-sm">
                  <Flame className="h-3.5 w-3.5 text-orange-500 animate-bounce-subtle" />
                  <span className="text-[9px] font-bold text-orange-700">12 Days</span>
                </div>
                <MoreHorizontal className="h-4 w-4 text-slate-300 hover:text-slate-600 cursor-pointer transition-colors hover:scale-110" />
              </div>
            </div>

            <div className="grid grid-cols-[170px_1fr] gap-6 mt-5 h-[calc(100%-68px)]">
              {/* Sidebar */}
              <div className="flex flex-col justify-between">
                <div className="flex flex-col gap-1">
                  {tabs.map((tab, i) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] font-semibold transition-all duration-300 cursor-pointer shine-hover ${isActive
                            ? 'text-slate-900 bg-slate-100 shadow-sm ring-1 ring-slate-200/60'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50/80'
                          }`}
                        style={{
                          opacity: isLoaded ? 1 : 0,
                          transform: isLoaded ? 'translateX(0)' : 'translateX(-30px)',
                          transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + i * 0.1}s`
                        }}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-r-full" />
                        )}
                        <Icon className={`h-4 w-4 transition-all duration-300 ${isActive ? 'text-emerald-600 scale-110' : 'text-slate-400'}`} />
                        <span className="tracking-tight">{tab.label}</span>
                        {tab.id === 'live' && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)] animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Profile Card with magnetic tilt */}
                <div
                  className="rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer shine-hover group"
                  onMouseMove={(e) => handleCardMouseMove(e, 99)}
                  onMouseLeave={() => handleCardMouseLeave(99)}
                  style={{
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded
                      ? `translateY(0) rotateX(${cardTilts[99]?.y || 0}deg) rotateY(${cardTilts[99]?.x || 0}deg)`
                      : 'translateY(30px)',
                    transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.6s, transform 0.3s ease-out, box-shadow 0.5s ease',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-xs font-bold text-white flex items-center justify-center shadow-lg ring-2 ring-white">
                        JD
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-[2.5px] border-white shadow-sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-slate-800 truncate">John Doe</div>
                      <div className="text-[9px] text-slate-500 font-semibold">Level 12 Scholar</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[9px] text-slate-500 font-medium">
                    <span>Weekly XP</span>
                    <span className="font-bold text-emerald-700">2,450</span>
                  </div>
                  <div className="mt-1.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden ring-1 ring-slate-200/50">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full w-[72%] shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex flex-col gap-5 overflow-hidden" style={{ transform: 'translateZ(20px)' }}>
                <div
                  style={{
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.4s'
                  }}
                >
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                    Systems & Algorithms
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 shadow-sm">In Progress</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">Section A: Graph Structures & Filters</p>
                </div>

                {/* Progress Path - Ultra sharp */}
                <div
                  className="rounded-2xl bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/80 p-5 flex flex-col justify-between h-[130px] shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-500 group shine-hover"
                  style={{
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'scale(1)' : 'scale(0.92)',
                    transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                      <Target className="h-3.5 w-3.5" /> Weekly Target
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5 rounded-full border border-emerald-200/60 shadow-sm">
                      {animatedProgress}% Progress
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2 py-2">
                    {[1, 2, 3, 4, 5].map((step, i) => {
                      const isCompleted = step < 3;
                      const isCurrent = step === 3;

                      return (
                        <React.Fragment key={step}>
                          <div
                            className={`relative flex items-center justify-center rounded-full transition-all duration-500 ${isCompleted
                                ? 'h-8 w-8 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/60 ring-2 ring-emerald-100'
                                : isCurrent
                                  ? 'h-9 w-9 bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl shadow-emerald-300/50 ring-2 ring-emerald-200 animate-pulse-glow'
                                  : 'h-8 w-8 bg-white border-2 border-slate-200 text-slate-400 hover:border-slate-300 transition-colors'
                              }`}
                            style={{
                              opacity: isLoaded ? 1 : 0,
                              transform: isLoaded ? 'scale(1)' : 'scale(0)',
                              transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.6 + i * 0.12}s`
                            }}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <span className="text-[10px] font-bold">{step}</span>
                            )}
                            {isCurrent && (
                              <>
                                <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-40" />
                                <div className="absolute -inset-1 rounded-full bg-emerald-400/20 blur-md animate-pulse" />
                              </>
                            )}
                          </div>
                          {step < 5 && (
                            <div className={`h-[3px] rounded-full transition-all duration-1000 ${isCompleted ? 'w-7 bg-gradient-to-r from-emerald-400 to-emerald-500' : 'w-7 bg-slate-200'
                              }`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden ring-1 ring-slate-200/50">
                    <div
                      className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 h-full rounded-full animate-progress relative shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-md border-[2px] border-emerald-400 ring-2 ring-white" />
                    </div>
                  </div>
                </div>

                {/* Stats Grid - Magnetic hover */}
                <div className="grid grid-cols-3 gap-3">
                  {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="rounded-xl bg-white border border-slate-200/80 p-4 hover:shadow-xl hover:-translate-y-1.5 hover:border-slate-300/80 transition-all duration-500 cursor-pointer shine-hover group"
                        onMouseMove={(e) => handleCardMouseMove(e, i)}
                        onMouseLeave={() => handleCardMouseLeave(i)}
                        style={{
                          opacity: isLoaded ? 1 : 0,
                          transform: isLoaded
                            ? `translateY(0) rotateX(${cardTilts[i]?.y || 0}deg) rotateY(${cardTilts[i]?.x || 0}deg)`
                            : 'translateY(25px)',
                          transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${stat.delay}s, transform 0.3s ease-out, box-shadow 0.5s ease`,
                          transformStyle: 'preserve-3d'
                        }}
                      >
                        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 ring-1 ring-white/20`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="mt-3 text-xl font-extrabold text-slate-900 tracking-tight">{stat.value}</div>
                        <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* LAYER 2: Recruiter Insights (Foreground, pops OUT) */}
          <div
            className="absolute bottom-8 right-8 w-[52%] h-[84%] rounded-2xl border border-slate-200/90 bg-white/98 backdrop-blur-sm p-6 depth-shadow-front z-20 overflow-hidden"
            style={{
              transform: isLoaded ? 'translate3d(20px, 20px, 80px) rotateY(-3deg)' : 'translate3d(20px, 20px, 0px) rotateY(-8deg)',
              opacity: isLoaded ? 1 : 0,
              transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
              transformStyle: 'preserve-3d',
              borderTop: '3px solid #58CC02',
              willChange: 'transform, opacity'
            }}
          >
            {/* Sharp top glow */}
            <div className="absolute top-0 right-0 h-40 w-40 bg-[#58CC02]/8 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#58CC02]/30 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-[#58CC02]/10 flex items-center justify-center text-[#58CC02] shadow-sm ring-1 ring-[#58CC02]/20">
                  <Sparkles className="h-4 w-4 fill-[#58CC02]/20" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 tracking-[0.15em] uppercase">Recruiter Insights</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-700">Live Updates</span>
                  </div>
                </div>
              </div>
              <Search className="h-4 w-4 text-slate-400 hover:text-slate-700 cursor-pointer transition-all hover:scale-110" />
            </div>

            <div className="flex flex-col gap-5 mt-5 h-[calc(100%-68px)]">
              <div className="grid grid-cols-[130px_1fr] gap-5">
                {/* Circular Gauge - Ultra sharp */}
                <div
                  className="flex flex-col items-center justify-center border border-slate-200/80 rounded-2xl bg-gradient-to-br from-slate-50/80 to-white p-4 text-center shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-500 shine-hover group"
                  style={{
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'scale(1)' : 'scale(0.85)',
                    transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s'
                  }}
                >
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">Readiness</span>

                  <div className="relative h-24 w-24 my-3 flex items-center justify-center">
                    <svg className="absolute inset-0 h-full w-full -rotate-90" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}>
                      <circle cx="48" cy="48" r="38" fill="transparent" stroke="#E2E8F0" strokeWidth="6" />
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        fill="transparent"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="6"
                        strokeDasharray={239}
                        strokeDashoffset={239 - (239 * 87) / 100}
                        strokeLinecap="round"
                        className="animate-draw-circle"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(88,204,2,0.4))' }}
                      />
                      <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#58CC02" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-900 leading-none tracking-tighter">{animatedScore}</span>
                      <span className="text-[9px] text-slate-500 font-bold mt-0.5">/100</span>
                    </div>
                  </div>

                  <span className="text-[9px] font-bold text-emerald-700 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1 rounded-full border border-emerald-200/60 shadow-sm">
                    Top 4% Match
                  </span>
                </div>

                {/* Verification Badges */}
                <div
                  className="flex flex-col gap-2.5 justify-center py-1"
                  style={{
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateX(0)' : 'translateX(25px)',
                    transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.8s'
                  }}
                >
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-1 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-emerald-600" /> Verification
                  </span>

                  {badges.map((badge) => (
                    <div
                      key={badge.label}
                      className="flex items-center gap-2.5 text-xs text-slate-700 group cursor-pointer hover:bg-slate-50 rounded-xl px-3 py-2 -mx-2 transition-all duration-300 shine-hover"
                      style={{
                        opacity: isLoaded ? 1 : 0,
                        transform: isLoaded ? 'translateX(0)' : 'translateX(15px)',
                        transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${badge.delay}s`
                      }}
                    >
                      <div className="relative">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-50 group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-0 group-hover:opacity-30 transition-opacity" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{badge.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job Matches - High contrast, magnetic hover */}
              <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">Top Matches</span>
                  <span className="text-[9px] font-bold text-slate-400 hover:text-slate-700 cursor-pointer transition-colors hover:underline">View All</span>
                </div>

                <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                  {jobs.map((job, i) => (
                    <div
                      key={job.company}
                      onMouseEnter={() => setHoveredJob(i)}
                      onMouseLeave={() => setHoveredJob(null)}
                      onMouseMove={(e) => handleCardMouseMove(e, i + 10)}
                      className={`relative border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all duration-500 overflow-hidden shine-hover ${hoveredJob === i
                          ? 'border-emerald-300/60 bg-gradient-to-r from-slate-900 to-slate-800 shadow-2xl shadow-slate-900/30 scale-[1.03] ring-1 ring-emerald-500/20'
                          : 'border-slate-200/80 bg-slate-900 hover:bg-slate-800 shadow-md'
                        }`}
                      style={{
                        opacity: isLoaded ? 1 : 0,
                        transform: isLoaded
                          ? `translateY(0) rotateX(${cardTilts[i + 10]?.y || 0}deg) rotateY(${cardTilts[i + 10]?.x || 0}deg) ${hoveredJob === i ? 'scale(1.03)' : 'scale(1)'}`
                          : 'translateY(30px)',
                        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${job.delay}s, transform 0.3s ease-out, box-shadow 0.5s ease, border-color 0.3s ease`,
                        transformStyle: 'preserve-3d'
                      }}
                    >
                      {/* Ambient glow on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 transition-opacity duration-500 ${hoveredJob === i ? 'opacity-100' : 'opacity-0'}`} />

                      <div className="flex items-center gap-3 relative z-10">
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-tr ${job.color} flex items-center justify-center text-white font-extrabold text-sm shadow-lg ring-2 ring-white/20 transition-transform duration-300 ${hoveredJob === i ? 'scale-110' : ''}`}>
                          {job.letter}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-white flex items-center gap-1 tracking-tight">
                            {job.company}
                            <ArrowUpRight className={`h-3.5 w-3.5 text-emerald-400 transition-all duration-300 ${hoveredJob === i ? 'translate-x-0.5 -translate-y-0.5' : ''}`} />
                          </div>
                          <div className="text-[9px] text-slate-400 font-medium">{job.role}</div>
                        </div>
                      </div>

                      <div className="text-right relative z-10">
                        <div className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full inline-block transition-all duration-300 shadow-lg ${hoveredJob === i
                            ? 'bg-emerald-500 text-white shadow-emerald-500/40 scale-110'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          }`}>
                          {hoveredJob === i ? `${animatedMatch}%` : `${job.match}%`} Match
                        </div>
                        <div className="text-[8px] text-slate-500 mt-1 font-medium">Pipeline Auto-Unlock</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating depth indicator */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-lg text-[10px] font-bold text-slate-500 z-30 hover:scale-105 transition-transform cursor-help"
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 1s ease 1.5s',
              transform: 'translateZ(100px)'
            }}
          >
            <MousePointer2 className="h-3 w-3 text-emerald-500" />
            <span>Move cursor to explore depth</span>
          </div>
        </div>
      </div>
    </div>
  );
};