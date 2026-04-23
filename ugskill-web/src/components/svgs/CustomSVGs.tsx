import React from 'react';
import { motion } from 'framer-motion';

export const LogoTickerSVGs = [
  // Abstract logos for the ticker
  () => (
    <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 10L30 30H10L20 10Z" fill="currentColor" opacity="0.7"/>
      <circle cx="45" cy="20" r="10" fill="currentColor" opacity="0.5"/>
      <rect x="65" y="10" width="20" height="20" rx="4" fill="currentColor" opacity="0.3"/>
      <text x="95" y="25" fill="currentColor" fontSize="14" fontWeight="bold" fontFamily="sans-serif">ACME</text>
    </svg>
  ),
  () => (
    <svg width="140" height="40" viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 20C10 14.4772 14.4772 10 20 10C25.5228 10 30 14.4772 30 20C30 25.5228 25.5228 30 20 30C14.4772 30 10 25.5228 10 20Z" stroke="currentColor" strokeWidth="4" opacity="0.6"/>
      <path d="M40 10L60 10L50 30L40 10Z" stroke="currentColor" strokeWidth="3" opacity="0.8"/>
      <text x="75" y="25" fill="currentColor" fontSize="14" fontWeight="bold" fontFamily="sans-serif" letterSpacing="2">GLOBAL</text>
    </svg>
  ),
  () => (
    <svg width="130" height="40" viewBox="0 0 130 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="15" width="30" height="10" rx="5" fill="currentColor" opacity="0.8"/>
      <circle cx="25" cy="20" r="4" fill="var(--bg-app)"/>
      <text x="55" y="25" fill="currentColor" fontSize="14" fontWeight="bold" fontFamily="sans-serif">NEXUS</text>
    </svg>
  ),
  () => (
    <svg width="150" height="40" viewBox="0 0 150 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 30L20 10L30 30L40 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
      <text x="55" y="25" fill="currentColor" fontSize="14" fontWeight="bold" fontFamily="sans-serif">VERTEX</text>
    </svg>
  )
];

// SVG for the Learning Engine (LMS)
export const LearningEngineSVG: React.FC = () => (
  <svg width="100%" height="100%" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-learning" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1" stopOpacity="0.2"/>
        <stop offset="1" stopColor="#818cf8" stopOpacity="0.0"/>
      </linearGradient>
      <linearGradient id="line-grad" x1="0" y1="0" x2="500" y2="500">
        <stop stopColor="#818cf8" stopOpacity="0.8"/>
        <stop offset="1" stopColor="#4f46e5" stopOpacity="0.2"/>
      </linearGradient>
    </defs>
    <rect width="500" height="500" rx="30" fill="url(#grad-learning)" />
    
    <rect x="50" y="80" width="250" height="200" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
    <rect x="70" y="100" width="120" height="15" rx="4" fill="rgba(255,255,255,0.2)"/>
    <rect x="70" y="130" width="200" height="8" rx="4" fill="rgba(255,255,255,0.1)"/>
    <rect x="70" y="150" width="180" height="8" rx="4" fill="rgba(255,255,255,0.1)"/>
    
    <circle cx="250" cy="180" r="30" fill="#6366f1" opacity="0.8"/>
    <path d="M242 165L268 180L242 195V165Z" fill="white"/>
    
    <motion.path 
      d="M300 180 C 350 180, 350 300, 400 300" 
      stroke="url(#line-grad)" 
      strokeWidth="4" 
      strokeDasharray="10 10"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 2, ease: "easeInOut" }}
    />
    
    <circle cx="400" cy="300" r="15" fill="#818cf8"/>
    <rect x="320" y="320" width="150" height="80" rx="8" fill="rgba(255,255,255,0.03)" stroke="#818cf8" strokeWidth="1"/>
    <rect x="340" y="340" width="80" height="6" rx="3" fill="#818cf8" opacity="0.5"/>
    <rect x="340" y="360" width="110" height="6" rx="3" fill="rgba(255,255,255,0.2)"/>
  </svg>
);

// SVG for Assessment Engine (Exams)
export const AssessmentEngineSVG: React.FC = () => (
  <svg width="100%" height="100%" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-assessment" x1="0" y1="500" x2="500" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ef4444" stopOpacity="0.15"/>
        <stop offset="1" stopColor="#f87171" stopOpacity="0.0"/>
      </linearGradient>
    </defs>
    <rect width="500" height="500" rx="30" fill="url(#grad-assessment)" />
    
    <circle cx="250" cy="250" r="150" stroke="rgba(239,68,68,0.2)" strokeWidth="2" strokeDasharray="10 10"/>
    <circle cx="250" cy="250" r="100" stroke="rgba(239,68,68,0.4)" strokeWidth="4"/>
    <circle cx="250" cy="250" r="40" fill="#ef4444" opacity="0.8"/>
    
    <motion.g 
      animate={{ y: [0, -15, 0] }} 
      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
    >
      <rect x="100" y="150" width="60" height="80" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)"/>
      <path d="M120 170L140 170" stroke="white" strokeWidth="4" strokeLinecap="round"/>
      <path d="M120 190L130 190" stroke="rgba(255,255,255,0.5)" strokeWidth="4" strokeLinecap="round"/>
    </motion.g>

    <motion.g 
      animate={{ y: [0, 20, 0] }} 
      transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
    >
      <rect x="350" y="280" width="80" height="100" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)"/>
      <circle cx="390" cy="310" r="15" stroke="#f87171" strokeWidth="4"/>
      <path d="M390 310L390 300" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
      <path d="M370 350L410 350" stroke="rgba(255,255,255,0.5)" strokeWidth="4" strokeLinecap="round"/>
    </motion.g>
    
    <motion.path
      d="M250 250 L 250 100 A 150 150 0 0 1 356 144 Z"
      fill="rgba(239,68,68,0.1)"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
      style={{ originX: "250px", originY: "250px" }}
    />
  </svg>
);

// SVG for Career Launchpad (Placements)
export const CareerLaunchpadSVG: React.FC = () => (
  <svg width="100%" height="100%" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-career" x1="0" y1="0" x2="0" y2="500" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10b981" stopOpacity="0.2"/>
        <stop offset="1" stopColor="#34d399" stopOpacity="0.0"/>
      </linearGradient>
    </defs>
    <rect width="500" height="500" rx="30" fill="url(#grad-career)" />
    
    <path d="M50 400 L 150 350 L 250 380 L 350 200 L 450 150" stroke="rgba(255,255,255,0.1)" strokeWidth="4" strokeLinejoin="round"/>
    
    <motion.path 
      d="M50 400 L 150 350 L 250 380 L 350 200 L 450 150" 
      stroke="#10b981" 
      strokeWidth="6" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 2, ease: "easeOut" }}
    />
    
    <motion.circle 
      cx="450" cy="150" r="12" fill="#10b981"
      initial={{ scale: 0 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 2, type: "spring" }}
    />

    <rect x="80" y="80" width="140" height="60" rx="8" fill="rgba(255,255,255,0.05)" stroke="#34d399" strokeWidth="1"/>
    <circle cx="110" cy="110" r="15" fill="rgba(255,255,255,0.2)"/>
    <rect x="135" y="100" width="60" height="6" rx="3" fill="#34d399" opacity="0.8"/>
    <rect x="135" y="115" width="40" height="6" rx="3" fill="rgba(255,255,255,0.2)"/>

    <rect x="250" y="120" width="120" height="50" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
    <rect x="270" y="135" width="80" height="5" rx="2" fill="rgba(255,255,255,0.3)"/>
    <rect x="270" y="150" width="50" height="5" rx="2" fill="rgba(255,255,255,0.1)"/>

    <rect x="280" y="260" width="160" height="70" rx="8" fill="rgba(16,185,129,0.1)" stroke="#10b981" strokeWidth="2"/>
    <path d="M300 295L315 310L350 275" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="365" y="280" width="50" height="6" rx="3" fill="#10b981"/>
    <rect x="365" y="295" width="30" height="6" rx="3" fill="rgba(255,255,255,0.3)"/>
  </svg>
);

// SVG for Group Discussion & Network
export const GroupDiscussionSVG: React.FC = () => (
  <svg width="100%" height="100%" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-network" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a855f7" stopOpacity="0.2"/>
        <stop offset="1" stopColor="#d8b4fe" stopOpacity="0.0"/>
      </linearGradient>
      <linearGradient id="node-link" x1="0" y1="0" x2="500" y2="500">
        <stop stopColor="#a855f7" stopOpacity="0.8"/>
        <stop offset="1" stopColor="#d8b4fe" stopOpacity="0.3"/>
      </linearGradient>
    </defs>
    <rect width="500" height="500" rx="30" fill="url(#grad-network)" />

    {/* Central Hub */}
    <circle cx="250" cy="250" r="40" fill="rgba(168,85,247,0.1)" stroke="#a855f7" strokeWidth="2" strokeDasharray="5 5"/>
    <motion.circle 
      cx="250" cy="250" r="25" fill="#a855f7"
      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Network Lines */}
    <motion.path 
      d="M250 250 L 120 120 M 250 250 L 380 120 M 250 250 L 120 380 M 250 250 L 380 380" 
      stroke="url(#node-link)" 
      strokeWidth="3"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.5, ease: "easeOut" }}
    />

    {/* Orbiting Connection Lines */}
    <motion.path
      d="M120 120 Q 250 50 380 120 T 380 380 T 120 380 T 120 120"
      stroke="rgba(216,180,254,0.3)"
      strokeWidth="2"
      strokeDasharray="10 15"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      style={{ originX: "250px", originY: "250px" }}
    />

    {/* Peripheral Nodes */}
    <circle cx="120" cy="120" r="15" fill="#d8b4fe"/>
    <circle cx="380" cy="120" r="15" fill="#d8b4fe"/>
    <circle cx="120" cy="380" r="15" fill="#d8b4fe"/>
    <circle cx="380" cy="380" r="15" fill="#d8b4fe"/>

    {/* Floating Chat Bubbles (Abstract) */}
    <motion.g animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      <rect x="70" y="70" width="40" height="25" rx="8" fill="rgba(255,255,255,0.1)" stroke="#d8b4fe" strokeWidth="1"/>
      <path d="M90 95 L 85 105 L 100 95 Z" fill="rgba(255,255,255,0.1)" stroke="#d8b4fe" strokeWidth="1"/>
    </motion.g>

    <motion.g animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
      <rect x="390" y="80" width="50" height="30" rx="10" fill="rgba(168,85,247,0.2)" stroke="#a855f7" strokeWidth="2"/>
      <rect x="400" y="90" width="30" height="4" rx="2" fill="rgba(255,255,255,0.5)"/>
      <rect x="400" y="100" width="20" height="4" rx="2" fill="rgba(255,255,255,0.3)"/>
    </motion.g>
  </svg>
);
