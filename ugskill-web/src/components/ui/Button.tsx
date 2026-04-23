import React from 'react';
import { cn } from '../../lib/utils';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, fullWidth, leftIcon, rightIcon, children, style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          'base-btn',
          `btn-${variant}`,
          `btn-${size}`,
          isLoading && 'btn-loading',
          fullWidth && 'btn-full-width',
          className
        )}
        style={style}
        {...props}
      >
        {isLoading ? (
          <span className="btn-spinner"></span>
        ) : null}
        <span className={cn('btn-inner', isLoading && 'opacity-0')}>
          {leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
