import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import type { ButtonProps } from './Button';
import './IconButton.css';

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode;
  'aria-label': string; // Accessibility requirement for icon-only buttons
  shape?: 'square' | 'circle';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, shape = 'square', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn('icon-btn', `icon-shape-${shape}`, className)}
        {...props}
      >
        <span className="icon-btn-content">{icon}</span>
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
