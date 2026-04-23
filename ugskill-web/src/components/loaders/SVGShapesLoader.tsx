import React from 'react';
import { cn } from '../../lib/utils';
import './SVGShapesLoader.css';

interface SVGShapesLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const SVGShapesLoader: React.FC<SVGShapesLoaderProps> = ({ 
  className,
  size = 'md' 
}) => {
  return (
    <div className={cn('shapes-loader-container', `loader-${size}`, className)}>
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="shapes-svg"
      >
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
        </filter>
        <g filter="url(#goo)">
          <circle cx="50" cy="50" r="20" className="shape circle-1" />
          <circle cx="50" cy="50" r="20" className="shape circle-2" />
          <circle cx="50" cy="50" r="20" className="shape circle-3" />
        </g>
      </svg>
      <div className="loader-text">Initializing Gateway...</div>
    </div>
  );
};
