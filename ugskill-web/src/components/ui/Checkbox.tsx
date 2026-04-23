import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import './Primitives.css';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, disabled, ...props }, ref) => {
    return (
      <label className={cn('ug-checkbox-container', disabled && 'disabled', className)}>
        <input 
          type="checkbox" 
          className="ug-checkbox-input" 
          disabled={disabled}
          ref={ref}
          {...props} 
        />
        <div className="ug-checkbox-custom">
          <Check className="ug-checkbox-icon" strokeWidth={3} />
        </div>
        {label && <span style={{ color: 'var(--on-surface)', fontSize: '0.875rem' }}>{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
