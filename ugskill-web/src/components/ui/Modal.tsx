import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import './Primitives.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="ug-modal-overlay" onClick={onClose}>
      <div className={cn('ug-modal-content', className)} onClick={e => e.stopPropagation()}>
        {title && (
          <div className="ug-modal-header">
            <h3 className="ug-modal-title">{title}</h3>
            <button className="ug-modal-close" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="ug-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};
