import React from 'react';
import { cn } from '../../lib/utils';
import './AuraProgress.css';

interface AuraProgressProps {
  className?: string;
  progress: number; // 0 to 100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AuraProgress: React.FC<AuraProgressProps> = ({
  className,
  progress,
  label,
  size = 'md',
}) => {
  // Ensure progress is clamped between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={cn('aura-progress-wrapper', `aura-progress-${size}`, className)}>
      {label && (
        <div className="aura-progress-header">
          <span className="aura-progress-label">{label}</span>
          <span className="aura-progress-value">{Math.round(normalizedProgress)}%</span>
        </div>
      )}
      <div className="aura-progress-track">
        <div
          className="aura-progress-fill"
          style={{ width: `${normalizedProgress}%` }}
        />
        <div 
          className="aura-progress-glow"
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
    </div>
  );
};
