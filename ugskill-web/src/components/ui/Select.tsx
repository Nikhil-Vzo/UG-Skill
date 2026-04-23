import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import './Primitives.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string | number }[];
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, label, ...props }, ref) => {
    return (
      <div className={cn('ug-select-wrapper', className)}>
        {label && <label style={{ color: 'var(--on-surface)', fontSize: '0.875rem' }}>{label}</label>}
        <div style={{ position: 'relative' }}>
          <select className="ug-select" ref={ref} {...props}>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="ug-select-icon" size={16} />
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';
