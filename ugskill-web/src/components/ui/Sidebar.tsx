import React from 'react';
import { cn } from '../../lib/utils';
import { NavLink, useLocation } from 'react-router-dom';
import { MAIN_NAV_ITEMS, ADMIN_NAV_ITEMS, FOOTER_NAV_ITEMS } from '../../config/navigation';
import { useAuthStore } from '../../store/auth.store';
import './Sidebar.css';

interface SidebarProps {
  className?: string;
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, isOpen, onClose }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const isAdminOrCreator = user?.roles?.includes('admin') || user?.roles?.includes('creator');
  const isAdminPortal = location.pathname.startsWith('/admin');

  return (
    <>
      <div 
        className={cn('sidebar-overlay', isOpen && 'open')} 
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={cn('ug-sidebar surface-container-low', isOpen && 'open', className)}>
        <nav className="sidebar-nav">
          {!isAdminPortal ? (
            <div className="nav-section">
              <h3 className="nav-heading">Main Menu</h3>
              <ul className="nav-list">
                {MAIN_NAV_ITEMS.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) => cn('nav-link', isActive && 'active')}
                      onClick={() => {
                        if (window.innerWidth < 768) onClose?.();
                      }}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            isAdminOrCreator && (
              <div className="nav-section">
                <h3 className="nav-heading">Administration</h3>
                <ul className="nav-list">
                  {ADMIN_NAV_ITEMS.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) => cn('nav-link', isActive && 'active')}
                        onClick={() => {
                          if (window.innerWidth < 768) onClose?.();
                        }}
                      >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          {FOOTER_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn('nav-link', isActive && 'active')}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </aside>
    </>
  );
};
