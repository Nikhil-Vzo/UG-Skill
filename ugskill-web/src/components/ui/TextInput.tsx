import React, { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import './TextInput.css';

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, label, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const defaultId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
    
    return (
      <div className="text-input-wrapper">
        {label && (
          <label htmlFor={defaultId} className="text-input-label">
            {label}
          </label>
        )}
        <div className={cn("text-input-container surface-well", error && "error", className)}>
          {leftIcon && <span className="text-input-icon left">{leftIcon}</span>}
          <input
            id={defaultId}
            ref={ref}
            className="text-input-element"
            {...props}
          />
          {rightIcon && <span className="text-input-icon right">{rightIcon}</span>}
        </div>
        {error && <span className="text-input-error-msg">{error}</span>}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
