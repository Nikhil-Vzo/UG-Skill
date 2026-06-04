'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 font-extrabold text-white">
              UG
            </div>
            <span className="text-xl font-bold tracking-tight text-deep-slate">
              UGSkill
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <div className="group relative">
              <button className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-deep-slate transition-colors">
                Platform <ChevronDown className="h-4 w-4" />
              </button>
              {/* Dropdown Menu (Placeholder layout for completeness) */}
              <div className="invisible absolute top-full left-0 z-10 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-diffused opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150">
                <Link href="/platform/lms" className="block rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-deep-slate">LMS & Streaks</Link>
                <Link href="/platform/exam" className="block rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-deep-slate">Proctoring Exam</Link>
                <Link href="/platform/placement" className="block rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-deep-slate">Readiness & Placement</Link>
              </div>
            </div>
            <Link href="/solutions/universities" className="text-sm font-medium text-slate-500 hover:text-deep-slate transition-colors">
              Solutions
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-500 hover:text-deep-slate transition-colors">
              Pricing
            </Link>
            <Link href="/resources" className="text-sm font-medium text-slate-500 hover:text-deep-slate transition-colors">
              Resources
            </Link>
          </div>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-5">
            <Link href="/auth/login" className="text-sm font-semibold text-slate-500 hover:text-deep-slate transition-colors">
              Login
            </Link>
            <Link 
              href="/auth/login?sandbox=true" 
              className="btn-tactile text-sm"
              style={{ backgroundColor: '#58CC02', borderColor: '#46A302' }}
            >
              Try Demo
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-500 hover:text-deep-slate"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-6 py-6 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/platform/lms" className="text-base font-medium text-slate-500 hover:text-deep-slate" onClick={() => setIsMobileMenuOpen(false)}>Platform</Link>
            <Link href="/solutions/universities" className="text-base font-medium text-slate-500 hover:text-deep-slate" onClick={() => setIsMobileMenuOpen(false)}>Solutions</Link>
            <Link href="/pricing" className="text-base font-medium text-slate-500 hover:text-deep-slate" onClick={() => setIsMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/resources" className="text-base font-medium text-slate-500 hover:text-deep-slate" onClick={() => setIsMobileMenuOpen(false)}>Resources</Link>
            <div className="h-px bg-slate-100 my-2"></div>
            <Link href="/auth/login" className="text-base font-semibold text-slate-500 hover:text-deep-slate" onClick={() => setIsMobileMenuOpen(false)}>
              Login
            </Link>
            <Link 
              href="/auth/login?sandbox=true" 
              className="btn-tactile text-center text-sm py-3"
              style={{ backgroundColor: '#58CC02', borderColor: '#46A302' }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Try Demo
            </Link>
          </div>
        </div>
      )}
    </motion.nav>
  );
};
