import React, { useRef, useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Menu, 
  ShieldCheck, 
  Sparkles, 
  X, 
  BookOpen, 
  Users, 
  Mic, 
  Briefcase, 
  CheckCircle2
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuthStore } from '../store/auth.store';
import { SmoothScroll } from '../components/ui/SmoothScroll';

// Lazy-load Three.js — excluded from initial bundle, loads only on desktop
const HeroScene = lazy(() =>
  import('../components/3d/HeroScene').then((m) => ({ default: m.HeroScene }))
);

import {
  LogoTickerSVGs,
  LearningEngineSVG,
  AssessmentEngineSVG,
  CareerLaunchpadSVG,
  GroupDiscussionSVG
} from '../components/svgs/CustomSVGs';

import { NavHeader } from '../components/ui/NavHeader';
import { Logo } from '../components/ui/Logo';
import './landing.css';

gsap.registerPlugin(ScrollTrigger);

// --- Interactive Lesson Card (Duolingo Style) ---
const InteractiveLessonCard: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const options = [
    "Collaborative Filtering System",
    "Random Matching Algorithm",
    "AI Readiness & Placement Matcher"
  ];

  const correctIndex = 2;

  const handleOptionClick = (idx: number) => {
    if (isChecked) return;
    setSelectedOption(idx);
  };

  const handleCheck = () => {
    if (selectedOption === null) return;
    setIsChecked(true);
    setIsCorrect(selectedOption === correctIndex);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setIsChecked(false);
    setIsCorrect(false);
  };

  return (
    <div className="interactive-lesson-card">
      <div className="lesson-header">
        <span className="lesson-badge">ACTIVE LESSON PREVIEW</span>
        <div className="lesson-progress-bar">
          <div className="lesson-progress-fill" style={{ width: '70%' }}></div>
        </div>
      </div>

      <div className="lesson-question-box">
        <div className="lesson-mascot-avatar">🤖</div>
        <div className="lesson-bubble">
          <p>Which system matches your verified skills directly with placement drives?</p>
        </div>
      </div>

      <div className="lesson-options-list">
        {options.map((opt, idx) => {
          let className = "lesson-option-btn";
          if (selectedOption === idx) className += " selected";
          if (isChecked) {
            if (idx === correctIndex) className += " correct";
            else if (selectedOption === idx) className += " incorrect";
          }

          return (
            <button
              key={idx}
              className={className}
              onClick={() => handleOptionClick(idx)}
              disabled={isChecked}
            >
              <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
              <span className="option-text">{opt}</span>
            </button>
          );
        })}
      </div>

      <div className="lesson-footer">
        {!isChecked ? (
          <button
            className="btn-3d btn-3d-green check-btn"
            onClick={handleCheck}
            disabled={selectedOption === null}
            style={{ width: '100%' }}
          >
            Check Answer
          </button>
        ) : (
          <div className={`lesson-result-drawer ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="result-text-wrap">
              <span className="result-icon">{isCorrect ? '🎉' : '⚠️'}</span>
              <div className="result-text-block">
                <h4 className="result-status">{isCorrect ? 'Correct! Excellent job.' : 'Incorrect! Try again.'}</h4>
                <p className="result-explanation">
                  {isCorrect 
                    ? 'AI Placement Matcher checks your readiness score against recruiter targets.' 
                    : 'The correct answer is C. Try resetting to see why!'}
                </p>
              </div>
            </div>
            <button
              className={`btn-3d ${isCorrect ? 'btn-3d-green' : 'btn-3d-red'} continue-btn`}
              onClick={handleReset}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [activeStep, setActiveStep] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  const getDashboardRoute = () => {
    if (user?.roles?.includes('admin') || user?.roles?.includes('creator')) return '/admin/analytics';
    if (user?.roles?.includes('hr')) return '/hr/dashboard';
    return '/app';
  };

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const steps = [
    {
      title: 'Adaptive Learning',
      badge: 'UNIT 1',
      mascotText: 'Hi! Let\'s build your base skills. I have laid out a personalized adaptive learning course path just for you!',
      color: '#58cc02',
      darkColor: '#46a302',
      sectionId: 'unit-1-learning',
      align: 'left',
      // Coordinates inside the fixed 600px width / 800px height container
      cx: '300px',
      cy: '90px',
      icon: <BookOpen size={24} />
    },
    {
      title: 'Proctored Assessments',
      badge: 'UNIT 2',
      mascotText: 'Next up: validation. Compete on our real-time AI Leaderboard under secure, anti-cheat proctoring!',
      color: '#ff4b4b',
      darkColor: '#ea2b2b',
      sectionId: 'unit-2-assessments',
      align: 'right',
      cx: '425px',
      cy: '250px',
      icon: <ShieldCheck size={24} />
    },
    {
      title: 'Live Group Discussions',
      badge: 'UNIT 3',
      mascotText: 'Now, let\'s collaborate! Participate in live, platform-native GDs with peers and boost your confidence.',
      color: '#ce82ff',
      darkColor: '#aa60eb',
      sectionId: 'unit-3-community',
      align: 'left',
      cx: '300px',
      cy: '410px',
      icon: <Users size={24} />
    },
    {
      title: 'AI Mock Interviews',
      badge: 'UNIT 4',
      mascotText: 'Get ready for the real deal! Practice mock interviews 1-on-1 with me and get granular, actionable feedback.',
      color: '#ff9600',
      darkColor: '#e07b00',
      sectionId: 'unit-4-interviews',
      align: 'right',
      cx: '175px',
      cy: '570px',
      icon: <Mic size={24} />
    },
    {
      title: 'Career Placement Hub',
      badge: 'UNIT 5',
      mascotText: 'Unlock placement drives! Once your AI Readiness Score peaks, apply directly to hiring partners.',
      color: '#1cb0f6',
      darkColor: '#1899d6',
      sectionId: 'unit-5-placements',
      align: 'left',
      cx: '300px',
      cy: '730px',
      icon: <Briefcase size={24} />
    }
  ];

  const handleNodeClick = (sectionId: string, index: number) => {
    setActiveStep(index);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <SmoothScroll>
      <div className="landing-page" ref={mainRef}>

        {/* ── Nav ─────────────────────────────────────────── */}
        <nav className="landing-nav">
          <Logo />

          <div className="landing-nav-center">
            <NavHeader />
          </div>

          <div className="landing-nav-actions desktop-only">
            {isAuthenticated ? (
              <Link to={getDashboardRoute()} className="landing-nav-cta">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="landing-nav-link">Sign In</Link>
                <Link to="/signup" className="landing-nav-cta">Get Started Free</Link>
              </>
            )}
          </div>

          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* ── Mobile Menu Overlay ─────────────────────────── */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="mobile-menu-overlay"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mobile-menu-links">
                <a href="#" onClick={() => { setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</a>
                <a href="#ecosystem" onClick={() => setIsMobileMenuOpen(false)}>Ecosystem</a>

                <div className="mobile-menu-divider"></div>

                {isAuthenticated ? (
                  <Link to={getDashboardRoute()} className="mobile-menu-cta" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                ) : (
                  <>
                    <Link to="/login" className="mobile-menu-link" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                    <Link to="/signup" className="mobile-menu-cta" onClick={() => setIsMobileMenuOpen(false)}>Get Started Free</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hero Section ────────────────────────────────── */}
        <section className="hero-section">
          <div className="hero-bg-grid"></div>

          <div className="hero-content-split">
            <div className="hero-text-side">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="hero-badge-tech"
              >
                <div className="tech-tag">LIVE</div>
                <span className="tech-version">Learning + Placement OS</span>
                <div className="tech-divider"></div>
                <span className="tech-text">Built for outcomes</span>
              </motion.div>

              <h1 className="hero-title-wrap">
                {["UGSkill", "Career", "Journey"].map((word, i) => (
                  <motion.span
                    key={i}
                    className={`hero-word ${i === 0 ? 'accent' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: [0.215, 0.61, 0.355, 1] }}
                  >
                    {word}
                  </motion.span>
                ))}
              </h1>

              <motion.h2
                className="hero-subtitle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Learn, assess, debate, and interview. Traverse our interactive <span>Career Roadmaps</span> guided by AI to unlock placement drives and verify outcomes.
              </motion.h2>

              <motion.div
                className="hero-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                {isAuthenticated ? (
                  <Link to={getDashboardRoute()} className="btn-3d btn-3d-green hero-cta-main">
                    <span>Go to Dashboard</span>
                  </Link>
                ) : (
                  <>
                    <Link to="/signup" className="btn-3d btn-3d-green hero-cta-main">
                      <span>Start Learning Free</span>
                      <ArrowRight size={18} />
                    </Link>
                    <Link to="/login" className="btn-3d btn-3d-secondary hero-cta-secondary">
                      Sign In
                    </Link>
                  </>
                )}
              </motion.div>
            </div>

            <div className="hero-3d-side">
              {isMobile ? (
                <InteractiveLessonCard />
              ) : (
                <div className="hero-visual-shell">
                  <div className="hero-visual-chip hero-visual-chip-top">
                    <Sparkles size={14} />
                    Readiness score live
                  </div>
                  <div className="hero-visual-chip hero-visual-chip-bottom">
                    <ShieldCheck size={14} />
                    Secure assessment mode
                  </div>
                  <Suspense fallback={<div className="hero-3d-placeholder" />}>
                    <HeroScene />
                  </Suspense>

                  {/* Robo Guide Dialogue */}
                  <motion.div
                    className="robo-dialogue-v2"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                  >
                    <div className="dialogue-bubble-v2">
                      <span className="dialogue-tag">UG BOT</span>
                      <span className="dialogue-text">Welcome! Click down the path below to start your career story.</span>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Social Proof Ticker ─────────────────────────── */}
        <section className="ticker-section">
          <div className="ticker-fade-left"></div>
          <div className="ticker-fade-right"></div>

          <h4 className="ticker-label">Trusted by leading institutions and hiring partners</h4>

          <motion.div
            className="ticker-track"
            animate={{ x: [0, -1000] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          >
            {[...LogoTickerSVGs, ...LogoTickerSVGs, ...LogoTickerSVGs].map((LogoItem, i) => (
              <div key={i} className="ticker-item">
                <LogoItem />
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── Winding Career Path (Timeline) ───────────────── */}
        <section className="roadmap-section" id="ecosystem">
          <div className="section-header">
            <div className="section-tag-small">YOUR ROUTE</div>
            <h2 className="section-title">Walk the Skill Path</h2>
            <p className="section-subtitle">
              Duolingo-style progression tree. Complete units, test your skills, and unlock placement opportunities.
            </p>
          </div>

          <div className="roadmap-path-wrapper">
            <div className="roadmap-centered-content desktop-only">
              {/* Connection winding path line - Curved SVG */}
              <svg className="roadmap-svg-line" viewBox="0 0 600 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M 300,90 C 420,150 450,190 425,250 C 400,310 200,350 300,410 C 400,470 150,510 175,570 C 200,630 200,670 300,730" 
                  stroke="#e5e5e5" 
                  strokeWidth="12" 
                  strokeLinecap="round" 
                />
                <path 
                  d="M 300,90 C 420,150 450,190 425,250 C 400,310 200,350 300,410 C 400,470 150,510 175,570 C 200,630 200,670 300,730" 
                  stroke="#58cc02" 
                  strokeWidth="12" 
                  strokeLinecap="round" 
                  strokeDasharray="1000"
                  strokeDashoffset={1000 - (activeStep + 1) * 200}
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>

              <div className="roadmap-steps">
                {steps.map((step, idx) => {
                  const isActive = idx === activeStep;
                  return (
                    <div 
                      key={idx} 
                      className={`roadmap-step-item ${step.align} ${isActive ? 'active' : ''}`}
                      style={{
                        top: step.cy,
                        left: step.cx,
                      } as React.CSSProperties}
                    >
                      {/* Node circle */}
                      <button
                        className="roadmap-node-btn"
                        onClick={() => handleNodeClick(step.sectionId, idx)}
                        style={{
                          backgroundColor: step.color,
                          borderBottom: `6px solid ${step.darkColor}`,
                        }}
                        aria-label={`Scroll to ${step.title}`}
                      >
                        <span className="node-icon-wrap">{step.icon}</span>
                        <span className="node-badge-num">{idx + 1}</span>
                      </button>

                      {/* Mascot dialogue speech bubble */}
                      <div className="roadmap-mascot-bubble-wrap">
                        <div className="roadmap-mascot-avatar" style={{ border: `3px solid ${step.color}` }}>
                          <div className="mascot-face">🤖</div>
                        </div>
                        <div className="roadmap-dialogue-bubble">
                          <div className="bubble-tag" style={{ color: step.color }}>{step.badge}</div>
                          <h4 className="bubble-title">{step.title}</h4>
                          <p className="bubble-text">{step.mascotText}</p>
                          <div className="bubble-arrow"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile straight line fallback */}
            <div className="mobile-only">
              <div className="roadmap-line-connector"></div>
              <div className="roadmap-steps-mobile">
                {steps.map((step, idx) => {
                  const isActive = idx === activeStep;
                  return (
                    <div 
                      key={idx} 
                      className={`roadmap-step-item-mobile ${isActive ? 'active' : ''}`}
                    >
                      {/* Node circle */}
                      <button
                        className="roadmap-node-btn-mobile"
                        onClick={() => handleNodeClick(step.sectionId, idx)}
                        style={{
                          backgroundColor: step.color,
                          borderBottom: `6px solid ${step.darkColor}`,
                        }}
                        aria-label={`Scroll to ${step.title}`}
                      >
                        <span className="node-icon-wrap">{step.icon}</span>
                        <span className="node-badge-num">{idx + 1}</span>
                      </button>

                      {/* Mascot dialogue speech bubble */}
                      <div className="roadmap-mascot-bubble-wrap-mobile">
                        <div className="roadmap-mascot-avatar" style={{ border: `3px solid ${step.color}` }}>
                          <div className="mascot-face">🤖</div>
                        </div>
                        <div className="roadmap-dialogue-bubble">
                          <div className="bubble-tag" style={{ color: step.color }}>{step.badge}</div>
                          <h4 className="bubble-title">{step.title}</h4>
                          <p className="bubble-text">{step.mascotText}</p>
                          <div className="bubble-arrow"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Interactive Lesson Card Showcase (Replacing SaaS Mockup) ── */}
        <section className="pc-showcase-section">
          <div className="showcase-container">
            <motion.div 
              className="showcase-text"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="showcase-tag">Interactive Preview</div>
              <h2 className="showcase-title">Gamified skill metrics. Alive in your browser.</h2>
              <p className="showcase-desc">Give it a try right now! Click the correct option and hit check to test our responsive outcome matcher engine interface.</p>
            </motion.div>
            <div className="showcase-visual">
              <InteractiveLessonCard />
            </div>
          </div>
        </section>

        {/* ── Winding Story Chapters (Unit Sections) ───────── */}
        <div className="story-chapters-container">

          {/* UNIT 1: Adaptive Learning Engine */}
          <section className="unit-section unit-green" id="unit-1-learning">
            <div className="unit-card-glow"></div>
            <div className="unit-flex-split">
              <div className="unit-text-side">
                <div className="unit-badge">UNIT 1</div>
                <h2 className="unit-title">AI-Driven Adaptive Learning</h2>
                <p className="unit-desc">
                  No two paths are the same. Our AI engine evaluates your strengths and weaknesses in real-time, delivering custom course sequences and roadmaps tailored to your pace.
                </p>
                <ul className="unit-feature-list">
                  <li>
                    <CheckCircle2 size={18} className="feat-check" />
                    <span>Adapts dynamically to quiz performance</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="feat-check" />
                    <span>Visual path nodes showing exact lesson goals</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="feat-check" />
                    <span>Gamified achievements for course progression</span>
                  </li>
                </ul>
                <div className="unit-actions">
                  <Link to="/signup" className="btn-3d btn-3d-green">
                    Start Learning
                  </Link>
                </div>
              </div>
              <div className="unit-visual-side">
                <div className="unit-graphic-shell">
                  <LearningEngineSVG />
                </div>
              </div>
            </div>
          </section>

          {/* UNIT 2: Secure Assessments */}
          <section className="unit-section unit-red" id="unit-2-assessments">
            <div className="unit-card-glow"></div>
            <div className="unit-flex-split">
              <div className="unit-visual-side">
                <div className="unit-graphic-shell">
                  <AssessmentEngineSVG />
                </div>
              </div>
              <div className="unit-text-side">
                <div className="unit-badge">UNIT 2</div>
                <h2 className="unit-title">Proctored Exams & Leaderboards</h2>
                <p className="unit-desc">
                  Compete on India's first real-time AI Leaderboard. Take secure exams powered by anti-cheat webcam monitoring, and earn trust badges validated for direct recruiter reviews.
                </p>
                <ul className="unit-feature-list">
                  <li>
                    <CheckCircle2 size={18} className="feat-check" />
                    <span>AI-powered proctoring & tab-lock control</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="feat-check" />
                    <span>National rank list and skill benchmarks</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="feat-check" />
                    <span>Granular performance reports showing gaps</span>
                  </li>
                </ul>
                <div className="unit-actions">
                  <Link to="/signup" className="btn-3d btn-3d-red">
                    Test Your Skills
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* UNIT 3: Live Group Discussions */}
          <section className="unit-section unit-purple" id="unit-3-community">
            <div className="unit-card-glow"></div>
            <div className="unit-flex-split">
              <div className="unit-text-side">
                <div className="unit-badge">UNIT 3</div>
                <h2 className="unit-title">Live Group Discussions</h2>
                <p className="unit-desc">
                  Collaboration leads to success. Engage in real-time video group discussions (GDs) natively within the platform, complete with topic generators and peer evaluation systems.
                </p>
                <ul className="unit-feature-list">
                  <li>
                    <CheckCircle2 size={18} className="feat-check" />
                    <span>One-click join to live video rooms</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="feat-check" />
                    <span>Real-time debate prompts and timers</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="feat-check" />
                    <span>Peer scorecards and helpful communication tips</span>
                  </li>
                </ul>
                <div className="unit-actions">
                  <Link to="/signup" className="btn-3d btn-3d-purple">
                    Join Discussion
                  </Link>
                </div>
              </div>
              <div className="unit-visual-side">
                <div className="unit-graphic-shell">
                  <GroupDiscussionSVG />
                </div>
              </div>
            </div>
          </section>

          {/* UNIT 4: AI Mock Interviews */}
          <section className="unit-section unit-orange" id="unit-4-interviews">
            <div className="unit-card-glow"></div>
            <div className="unit-flex-split">
              <div className="unit-visual-side">
                <div className="unit-graphic-shell">
                  <CareerLaunchpadSVG />
                </div>
              </div>
              <div className="unit-text-side">
                <div className="unit-badge">UNIT 4</div>
                <h2 className="unit-title">AI Mock Interview Room</h2>
                <p className="unit-desc">
                  Ace the job. Practice technical and behavioral questions 1-on-1 with an AI bot that evaluates your answers, eye contact, speech patterns, and confidence in real-time.
                </p>
                <ul className="unit-feature-list">
                  <li>
                    <CheckCircle2 size={18} className="feat-check" />
                    <span>Customized roles (Software Eng, PM, Consultant)</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="feat-check" />
                    <span>Instant score breakdown and sample ideal answers</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="feat-check" />
                    <span>Webcam posture, pace, and vocal filler checks</span>
                  </li>
                </ul>
                <div className="unit-actions">
                  <Link to="/signup" className="btn-3d btn-3d-orange">
                    Practice Free
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* UNIT 5: Placement Hub */}
          <section className="unit-section unit-blue" id="unit-5-placements">
            <div className="unit-card-glow"></div>
            <div className="unit-flex-split">
              <div className="unit-text-side">
                <div className="unit-badge">UNIT 5</div>
                <h2 className="unit-title">Direct Placement Drives</h2>
                <p className="unit-desc">
                  Your readiness score is your ticket. Once you achieve target skill validation scores, unlock direct applications to placement drives hosted by top hiring corporate partners.
                </p>
                <ul className="unit-feature-list">
                  <li>
                    <CheckCircle2 size={18} className="feat-check" />
                    <span>Direct recruiter notifications for high scorers</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="feat-check" />
                    <span>Integrated resume builder & score syncing</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="feat-check" />
                    <span>End-to-end recruitment tracking status</span>
                  </li>
                </ul>
                <div className="unit-actions">
                  <Link to="/signup" className="btn-3d btn-3d-blue">
                    Apply to Jobs
                  </Link>
                </div>
              </div>
              <div className="unit-visual-side">
                <div className="unit-graphic-shell">
                  <CareerLaunchpadSVG />
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* ── Footer CTA ──────────────────────────────────── */}
        <section className="landing-footer-cta">
          <div className="cta-bg-glow"></div>
          <h2 className="cta-title">Ready to launch your story?</h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {isAuthenticated ? (
              <Link to={getDashboardRoute()} className="btn-3d btn-3d-green" style={{ padding: '1.25rem 3rem', fontSize: '1.25rem' }}>
                Enter the Dashboard
              </Link>
            ) : (
              <Link to="/signup" className="btn-3d btn-3d-green" style={{ padding: '1.25rem 3rem', fontSize: '1.25rem' }}>
                Create Your Account
              </Link>
            )}
          </motion.div>
        </section>

        {/* ── Premium Footer ──────────────────────────────── */}
        <footer className="premium-footer">
          <div className="footer-grid">
            <div className="footer-brand">
              <Logo />
              <p>India's first cognitive learning & placement ecosystem. Unlocking human potential with AI proctored validation and direct placement pipelines.</p>
            </div>

            <div className="footer-col">
              <h4>Platform</h4>
              <ul>
                <li><Link to="/lms">Learning Engine</Link></li>
                <li><Link to="/exams">Assessment Engine</Link></li>
                <li><Link to="/placements">Career Launchpad</Link></li>
                <li><Link to="/network">Enterprise Network</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/careers">Careers</Link></li>
                <li><Link to="/partners">Hiring Partners</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/cookies">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div>&copy; {new Date().getFullYear()} UGSkill. All rights reserved.</div>
            <div className="footer-socials">
              <a href="#">Twitter</a>
              <a href="#">LinkedIn</a>
              <a href="#">Instagram</a>
            </div>
          </div>
        </footer>

      </div>
    </SmoothScroll>
  );
};
