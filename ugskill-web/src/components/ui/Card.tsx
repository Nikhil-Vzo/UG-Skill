import React from 'react';
import { cn } from '../../lib/utils';
import './Primitives.css';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, headerAction, className, children, ...props }) => {
  return (
    <div className={cn('ug-card', className)} {...props}>
      {(title || headerAction) && (
        <div className="ug-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title && (typeof title === 'string' ? <h3 className="ug-card-title">{title}</h3> : title)}
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="ug-card-content">
        {children}
      </div>
    </div>
  );
};
