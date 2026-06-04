'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Magnet } from '../ui/Magnet';
import { DashboardMockup } from '../ui/DashboardMockup';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden bg-white flex flex-col items-center justify-start pt-16 md:pt-20 pb-20 px-6 lg:px-8">
      {/* Dynamic background accents (subtle, clean, neutral overlays) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[600px] bg-radial from-slate-50 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-4xl text-center flex flex-col items-center">
        {/* Hero Heading */}
        <div className="overflow-hidden py-1">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.15,
              ease: [0.215, 0.61, 0.355, 1],
            }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-deep-slate leading-[1.05]"
          >
            From Campus to Corporate
            <br />
            Without the Friction
          </motion.h1>
        </div>

        {/* Subtext Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.35,
            ease: "easeOut",
          }}
          className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mt-6"
        >
          The all-in-one LMS, Exam, and Placement engine that connects student learning directly to corporate readiness.
        </motion.p>

        {/* Tactile CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.5,
            ease: "easeOut",
          }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full sm:w-auto"
        >
          <Link
            href="/auth/login?sandbox=true"
            className="w-full sm:w-auto text-center bg-[#58CC02] text-white border-b-4 border-[#46A302] rounded-xl px-8 py-4 font-semibold active:border-b-0 active:translate-y-1 transition-all shadow-sm duration-75 select-none"
          >
            Try Interactive Demo
          </Link>

          <Link
            href="/company/contact"
            className="w-full sm:w-auto text-center text-slate-700 bg-slate-100 hover:bg-slate-200 border-b-4 border-slate-200 hover:border-slate-300 rounded-xl px-8 py-4 font-semibold active:border-b-0 active:translate-y-1 transition-all duration-75 select-none"
          >
            Book Enterprise Setup
          </Link>
        </motion.div>
      </div>

      {/* --- Technical Blueprint Boundary Frame --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.8,
          delay: 0.6,
          ease: [0.34, 1.56, 0.64, 1], // Springy ease
        }}
        className="mt-16 md:mt-24 w-full max-w-5xl p-6 md:p-10 rounded-3xl border border-slate-200 bg-slate-50/40 relative overflow-hidden flex items-center justify-center select-none"
      >
        {/* Blueprint technical grid lines background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        {/* Technical Label Overlays */}
        <div className="absolute top-4 left-6 text-slate-400 font-mono text-[9px] uppercase tracking-wider select-none pointer-events-none">
          [ug_system_preview]
        </div>
        <div className="absolute bottom-4 right-6 text-slate-400 font-mono text-[9px] uppercase tracking-wider select-none pointer-events-none">
          [z_axis_composition]
        </div>

        <Magnet strength={1.3}>
          <div className="w-full flex items-center justify-center relative z-10 max-w-4xl p-2">
            <DashboardMockup />
          </div>
        </Magnet>
      </motion.div>
    </section>
  );
};
