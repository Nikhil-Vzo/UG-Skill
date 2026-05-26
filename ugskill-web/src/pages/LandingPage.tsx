import React, { useRef, useLayoutEffect, useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Menu, ShieldCheck, Sparkles, X } from 'lucide-react';
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
import { ModernPricingPage } from '../components/ui/AnimatedPricing';
import type { PricingCardProps } from '../components/ui/AnimatedPricing';
import { NavHeader } from '../components/ui/NavHeader';
import { Logo } from '../components/ui/Logo';
import { SaaSDashboardMockup } from '../components/ui/SaaSDashboardMockup';
import './landing.css';

gsap.registerPlugin(ScrollTrigger);

const ugskillPricingPlans: PricingCardProps[] = [
  {
    planName: 'Explorer',
    description: 'Perfect for getting started with basic skills.',
    price: '0',
    features: ['Access to free foundational courses', 'Community forum access', 'Basic readiness score'],
    buttonText: 'Get Started Free',
    buttonVariant: 'secondary'
  },
  {
    planName: 'Pro',
    description: 'Everything you need to land your dream job.',
    price: '4999',
    features: ['All advanced structured courses', 'Unlimited proctored mock exams', 'Live Group Discussions', 'Direct application to placement drives', 'AI Interview Prep'],
    buttonText: 'Upgrade to Pro',
    isPopular: true,
    buttonVariant: 'primary'
  }
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Detect mobile — specifically phones (< 768px) to switch aesthetics
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
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

  useLayoutEffect(() => {
    // GSAP placeholder — sticky stacking handled by CSS
  }, []);

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
                <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>

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
          {/* <HeroScene /> is now in hero-3d-side */}
          <div className="landing-hero-glow-1"></div>
          <div className="landing-hero-glow-2"></div>
          <div className="hero-bg-grid"></div>

          <div className="landing-hero-glow"></div>


          <div className="hero-content-split">
            <div className="hero-text-side">
              <motion.div
                initial={{ opacity: 0, y: -10 }} /* Reduced movement for faster paint */
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="hero-badge-tech"
              >
                <div className="tech-tag">LIVE</div>
                <span className="tech-version">Learning + Placement OS</span>
                <div className="tech-divider"></div>
                <span className="tech-text">Built for career-ready outcomes</span>
                <div className="tech-chevron">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </motion.div>

              <h1 className="hero-title-wrap">
                {["UGSkill", "Career", "Ecosystem"].map((word, i) => (
                  <motion.span
                    key={i}
                    className={`hero-word ${i === 0 ? 'accent' : ''}`}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: [0.215, 0.61, 0.355, 1] }}
                  >
                    {word}
                  </motion.span>
                ))}
              </h1>

              <motion.h2
                className="hero-subtitle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
              >
                Move from skill-building to placement readiness with <span>AI-guided learning</span>, secure proctored assessments, live interview practice, and direct hiring workflows.
              </motion.h2>

              <motion.div
                className="hero-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.2 }}
              >
                {isAuthenticated ? (
                  <Link to={getDashboardRoute()} className="hero-cta-main">
                    <span>Go to Dashboard</span>
                    <div className="cta-glow"></div>
                  </Link>
                ) : (
                  <>
                    <Link to="/signup" className="hero-cta-main">
                      <span>Start Learning Free</span>
                      <ArrowRight size={18} />
                      <div className="cta-glow"></div>
                    </Link>
                    <Link to="/login" className="hero-cta-secondary">
                      Sign In
                    </Link>
                  </>
                )}
              </motion.div>
            </div>

            <div className="hero-3d-side">
              {isMobile ? (
                /* Premium Mobile SaaS Dashboard Mockup */
                <SaaSDashboardMockup />
              ) : (
                /* PC/Tablet 3D WebGL Scene */
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

                  {/* Robo Guide Holographic Dialogue */}
                  <motion.div
                    className="robo-dialogue-v2"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2.0, duration: 0.5 }}
                  >
                    <div className="hologram-effect"></div>
                    <div className="dialogue-bubble-v2">
                      <span className="dialogue-tag">UG BOT</span>
                      <span className="dialogue-text">Ready to master your future? I'm here to guide you!</span>
                      <div className="scanning-line"></div>
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
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          >
            {[...LogoTickerSVGs, ...LogoTickerSVGs, ...LogoTickerSVGs].map((Logo, i) => (
              <div key={i} className="ticker-item">
                <Logo />
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── PC Dashboard Showcase ──────────────────────── */}
        {!isMobile && (
          <section className="pc-showcase-section">
            <div className="showcase-container">
              <motion.div 
                className="showcase-text"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="showcase-tag">Platform Preview</div>
                <h2 className="showcase-title">Your career, centralized.</h2>
                <p className="showcase-desc">One interface to track learning, readiness, and placements.</p>
              </motion.div>
              <div className="showcase-visual">
                <div className="showcase-mockup-wrap-pc">
                  <SaaSDashboardMockup />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Bento Grid Ecosystem ────────────────────────── */}
        <div className="ecosystem-contrast-wrap">
        <section className="ecosystem-section" id="ecosystem">
          <div className="section-header">
            <motion.h2
              className="section-title"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              The complete ecosystem. Unmatched in India.
            </motion.h2>
          </div>

          <div className="bento-grid">
            {/* LMS / Learning Engine */}
            <motion.div
              className="bento-card large"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="bento-content">
                <h3>AI-Driven Learning Engine</h3>
                <p>Personalized roadmaps that adapt to your pace—an adaptive learning experience no competitor offers.</p>
              </div>
              <div className="bento-svg-wrap" style={{ opacity: 0.8 }}>
                <LearningEngineSVG />
              </div>
            </motion.div>

            {/* Placements / Career Launchpad */}
            <motion.div
              className="bento-card"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bento-content">
                <h3>The Ultimate Launchpad</h3>
                <p>Nail your dream job with AI Mock Interviews, direct placement drives, and platform-native Live GDs.</p>
              </div>
              <div className="bento-svg-wrap" style={{ right: '-20%', bottom: '-20%', opacity: 0.5 }}>
                <CareerLaunchpadSVG />
              </div>
            </motion.div>

            {/* Exams / Assessment Engine */}
            <motion.div
              className="bento-card"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bento-content">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1cb0f6', display: 'inline-block' }}></span>
                  Proctored Exams & AI Leaderboard
                </h3>
                <p>Compete on India's first real-time AI Leaderboard in highly secure, anti-cheat environments.</p>
              </div>
              <div className="bento-svg-wrap" style={{ right: '-15%', bottom: '-15%', opacity: 0.5 }}>
                <AssessmentEngineSVG />
              </div>
            </motion.div>

            {/* Community / Network */}
            <motion.div
              className="bento-card wide"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bento-content" style={{ maxWidth: '60%' }}>
                <h3>Cognitive Enterprise Network</h3>
                <p>Connect with peers via platform-native Live Group Discussions (GDs) and dominate the Hall of Fame.</p>
              </div>
              <div className="bento-svg-wrap" style={{ right: '0%', bottom: '-10%', width: '40%', height: '120%', opacity: 0.7 }}>
                <GroupDiscussionSVG />
              </div>
            </motion.div>
          </div>
        </section>
        </div>

        {/* ── Deep Dives (Sticky Stacking) ───────────────── */}
        <div className="deep-dive-container">

          <section className="deep-dive-section deep-dive-1">
            <motion.div
              className="deep-dive-text"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-20%" }}
            >
              <div className="deep-dive-tag">01 / The Learning Engine</div>
              <h2 className="deep-dive-title">The First AI-Driven Learning Engine.</h2>
              <p className="deep-dive-desc">Experience personalized learning like never before. Our platform adapts to your strengths and weaknesses in real-time. No other platform in India offers this level of dynamic, roadmap-based skill mastery.</p>
            </motion.div>
            <motion.div
              className="deep-dive-visual"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, margin: "-20%" }}
            >
              <LearningEngineSVG />
            </motion.div>
          </section>

          <section className="deep-dive-section deep-dive-2">
            <motion.div
              className="deep-dive-visual"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, margin: "-20%" }}
            >
              <AssessmentEngineSVG />
            </motion.div>
            <motion.div
              className="deep-dive-text"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-20%" }}
            >
              <div className="deep-dive-tag" style={{ color: '#1cb0f6' }}>02 / The Assessment Engine</div>
              <h2 className="deep-dive-title">Pioneering the AI Leaderboard.</h2>
              <p className="deep-dive-desc">Prove your knowledge in live, highly secure environments. Compete on our real-time AI Leaderboard—the first of its kind—and get granular, unbiased analytics on your performance gaps.</p>
            </motion.div>
          </section>

          <section className="deep-dive-section deep-dive-3">
            <motion.div
              className="deep-dive-text"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-20%" }}
            >
              <div className="deep-dive-tag" style={{ color: '#34d399' }}>03 / The Career Launchpad</div>
              <h2 className="deep-dive-title">Direct Access. Real Live GDs.</h2>
              <p className="deep-dive-desc">Don't just apply. Prepare with AI Mock Interviews and participate in Live Group Discussions directly on our platform. We connect you with hiring partners when your AI Readiness Score hits the mark.</p>
            </motion.div>
            <motion.div
              className="deep-dive-visual"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, margin: "-20%" }}
            >
              <CareerLaunchpadSVG />
            </motion.div>
          </section>

        </div>

        {/* ── Pricing Section (Animated Glassy) ─────────────── */}
        <ModernPricingPage
          title={<>Simple, <span style={{ color: '#1cb0f6' }}>transparent</span> pricing.</>}
          subtitle="Invest in your career today. Start for free, then upgrade to unlock powerful AI features."
          plans={ugskillPricingPlans}
        />

        {/* ── Footer CTA ──────────────────────────────────── */}
        <section className="landing-footer-cta">
          <div className="cta-bg-glow"></div>
          <h2 className="cta-title">Ready to launch?</h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {isAuthenticated ? (
              <Link to={getDashboardRoute()} className="landing-nav-cta" style={{ padding: '1.25rem 3rem', fontSize: '1.25rem' }}>
                Enter the Dashboard
              </Link>
            ) : (
              <Link to="/signup" className="landing-nav-cta" style={{ padding: '1.25rem 3rem', fontSize: '1.25rem' }}>
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
              <p>India's first cognitive ecosystem. Unlocking human potential with AI-driven learning, proctored assessments, and direct placements.</p>
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
