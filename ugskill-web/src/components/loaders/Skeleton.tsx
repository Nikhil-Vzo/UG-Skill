import React from 'react';
import { cn } from '../../lib/utils';
import './Skeleton.css';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'rounded' | 'text';
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rounded',
  width,
  height,
  style,
}) => {
  return (
    <div
      className={cn(
        'skeleton-base',
        'animate-shimmer',
        `skeleton-${variant}`,
        className
      )}
      style={{ width, height, ...style }}
    />
  );
};
