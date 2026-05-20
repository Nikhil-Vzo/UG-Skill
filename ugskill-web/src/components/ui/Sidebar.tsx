import React from 'react';
import { cn } from '../../lib/utils';
import { NavLink, useLocation } from 'react-router-dom';
import { MAIN_NAV_ITEMS, ADMIN_NAV_ITEMS, FOOTER_NAV_ITEMS } from '../../config/navigation';
import { useAuthStore } from '../../store/auth.store';
import { LayoutGrid, Telescope, Building2 } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  className?: string;
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, isOpen, onClose }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const isManager = user?.roles?.some(r => ['admin', 'creator', 'hr', 'super_admin'].includes(r));
  const isHR = user?.roles?.includes('hr');
  const isAdminPortal = location.pathname.startsWith('/app/admin');

  // Filter admin items based on role
  const visibleAdminItems = ADMIN_NAV_ITEMS.filter(item => {
    if (user?.roles?.some(r => ['admin', 'super_admin'].includes(r))) {
      return true;
    }
    if (isHR) {
      return item.to === '/app/admin/placements';
    }
    const isCreatorOrFaculty = user?.roles?.some(r => ['creator', 'faculty'].includes(r));
    if (isCreatorOrFaculty) {
      return [
        '/app/admin/courses',
        '/app/admin/quizzes/builder',
        '/app/admin/exams'
      ].includes(item.to);
    }
    return false;
  });

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
                      end
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
            <div className="nav-section">
              <h3 className="nav-heading">{isHR ? 'Recruiter Console' : 'Administration'}</h3>
              <ul className="nav-list">
                {isHR && (
                   <li>
                     <NavLink to="/hr/dashboard" end className={({ isActive }) => cn('nav-link', isActive && 'active')}>
                       <span className="nav-icon"><LayoutGrid size={18} /></span>
                       <span className="nav-label">HR Dashboard</span>
                     </NavLink>
                   </li>
                )}
                {!isHR && (
                  <li>
                    <NavLink to="/app/admin/analytics" end className={({ isActive }) => cn('nav-link', isActive && 'active')}>
                      <span className="nav-icon"><LayoutGrid size={18} /></span>
                      <span className="nav-label">Analytics Overview</span>
                    </NavLink>
                  </li>
                )}
                {visibleAdminItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end
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
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="dropdown-divider" style={{ margin: '0.5rem 0' }} />

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
