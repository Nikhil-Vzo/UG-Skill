# UGSkill Logo Component

This is the high-fidelity, animated React component for the UGSkill logo. It uses **Framer Motion** for animations and **SVG** for the core icon geometry.

### Usage
```tsx
import { Logo } from './components/ui/Logo';

// Small version (Navbars)
<Logo size="sm" />

// Medium version (Hero/Footer)
<Logo size="md" />

// Large version (Auth Headers)
<Logo size="lg" />

// Icon only
<Logo size="md" showText={false} />
```

### Component Code
```tsx
import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const dimensions = {
    sm: { box: 36, font: '0.8rem', text: '1.125rem', gap: '0.75rem' },
    md: { box: 52, font: '1rem', text: '1.625rem', gap: '1.25rem' },
    lg: { box: 72, font: '1.25rem', text: '2.25rem', gap: '1.5rem' },
  };

  const { box, text, gap } = dimensions[size];

  return (
    <div className="ugskill-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: gap }}>
      <div 
        className="ugskill-logo-icon-container" 
        style={{ 
          position: 'relative',
          width: box, 
          height: box,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {/* The "Cognitive Shell" - rotating outer rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            inset: 0,
            border: '1px solid rgba(129, 140, 248, 0.2)',
            borderRadius: '35% 65% 70% 30% / 30% 30% 70% 70%',
            background: 'radial-gradient(circle at top left, rgba(99, 102, 241, 0.15), transparent)',
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            inset: '4px',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '65% 35% 30% 70% / 70% 70% 30% 30%',
          }}
        />

        {/* The Main Icon Shape */}
        <div 
          style={{ 
            position: 'relative',
            width: '80%',
            height: '80%',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(79, 70, 229, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
            zIndex: 2,
            overflow: 'hidden'
          }}
        >
          {/* Animated Highlight Swipe */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              transform: 'skewX(-20deg)',
            }}
          />

          <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 3, transform: 'scale(0.8)' }}>
            <path 
              d="M10 12V22C10 26.4183 13.5817 30 18 30H22C26.4183 30 30 26.4183 30 22V12" 
              stroke="white" 
              strokeWidth="3.5" 
              strokeLinecap="round"
              style={{ opacity: 0.95 }}
            />
            <path 
              d="M30 20V22C30 26.4183 26.4183 30 22 30" 
              stroke="#A5B4FC" 
              strokeWidth="3.5" 
              strokeLinecap="round"
            />
            <path 
              d="M22 22H30" 
              stroke="white" 
              strokeWidth="3.5" 
              strokeLinecap="round"
            />
            
            <motion.circle 
              cx="22" cy="22" r="2.5" 
              fill="#fff"
              animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.3, 0.9] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }}
            />
          </svg>
        </div>
      </div>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, justifyContent: 'center' }}>
          <span 
            className="ugskill-logo-name" 
            style={{ 
              fontSize: text, 
              fontWeight: 900, 
              color: '#fff', 
              letterSpacing: '-0.05em',
              background: 'linear-gradient(to right, #fff 30%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            UGSkill
          </span>
          <span style={{ 
            fontSize: size === 'sm' ? '0.55rem' : '0.65rem', 
            color: '#818cf8', 
            fontWeight: 700, 
            letterSpacing: '0.25em', 
            textTransform: 'uppercase', 
            marginTop: '0.125rem', 
            opacity: 0.9 
          }}>
            Cognitive Ecosystem
          </span>
        </div>
      )}
    </div>
  );
};
```
