'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface MagnetProps {
  children: React.ReactNode;
  strength?: number; // 1 (subtle) to 5 (strong)
}

export const Magnet: React.FC<MagnetProps> = ({ children, strength = 1.2 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse positions normalized (-0.5 to 0.5) for tilt/parallax
  const normX = useMotionValue(0);
  const normY = useMotionValue(0);

  // Mouse absolute positions (in pixels) for the custom blob cursor
  const absX = useMotionValue(0);
  const absY = useMotionValue(0);

  // Spring configurations for buttery-smooth movements
  const springConfig = { damping: 25, stiffness: 150, mass: 0.8 };
  const springNormX = useSpring(normX, springConfig);
  const springNormY = useSpring(normY, springConfig);

  const springAbsX = useSpring(absX, { damping: 30, stiffness: 200 });
  const springAbsY = useSpring(absY, { damping: 30, stiffness: 200 });

  // Transform spring inputs to rotation (3D tilt) and translation values
  const rotateX = useTransform(springNormY, [-0.5, 0.5], [5 * strength, -5 * strength]);
  const rotateY = useTransform(springNormX, [-0.5, 0.5], [-5 * strength, 5 * strength]);
  const translateX = useTransform(springNormX, [-0.5, 0.5], [10 * strength, -10 * strength]);
  const translateY = useTransform(springNormY, [-0.5, 0.5], [10 * strength, -10 * strength]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Relative offset from container top-left (for custom blob position)
    absX.set(e.clientX - rect.left);
    absY.set(e.clientY - rect.top);

    // Mouse coordinates relative to the element center (-0.5 to 0.5)
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    normX.set(mouseX / width);
    normY.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    normX.set(0);
    normY.set(0);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center justify-center w-full select-none"
      style={{ 
        perspective: 1000,
        cursor: isHovered ? 'none' : 'default' 
      }}
    >
      <motion.div
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
          x: translateX,
          y: translateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          scale: isHovered ? 1.01 : 1,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full flex items-center justify-center"
      >
        {children}
      </motion.div>

      {/* --- CUSTOM BLOB CURSOR --- */}
      {isHovered && (
        <motion.div
          style={{
            left: springAbsX,
            top: springAbsY,
            x: '-50%',
            y: '-50%',
          }}
          className="absolute pointer-events-none z-30 flex items-center justify-center"
        >
          {/* Inner core active dot */}
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
          
          {/* Outer morphing blob container */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              borderRadius: ["50% 50% 50% 50%", "45% 55% 48% 52%", "50% 50% 50% 50%"]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute h-16 w-16 bg-[#58CC02]/15 border border-[#58CC02]/30 backdrop-blur-[1.5px] shadow-sm"
          />
        </motion.div>
      )}
    </div>
  );
};
