import React from 'react';
import { cn } from '../../lib/utils';
import './Primitives.css';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default' | 'outline' | 'error';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'primary', size = 'md', className, children, ...props }) => {
  return (
    <span className={cn('ug-badge', `ug-badge-${variant}`, size === 'sm' && 'ug-badge-sm', className)} {...props}>
      {children}
    </span>
  );
};
