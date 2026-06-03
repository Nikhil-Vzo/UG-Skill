import React from 'react';
import { cn } from '../../lib/utils';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MAIN_NAV_ITEMS, ADMIN_NAV_ITEMS, FOOTER_NAV_ITEMS } from '../../config/navigation';
import { useAuthStore } from '../../store/auth.store';
import { LayoutGrid, Telescope, Building2, LogOut, Settings, ShieldCheck, GraduationCap } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  className?: string;
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isManager = user?.roles?.some(r => ['admin', 'creator', 'hr', 'super_admin'].includes(r));
  const isHR = user?.roles?.includes('hr');
  const isAdminPortal = location.pathname.startsWith('/app/admin');

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Generate monogram from name (e.g., "Nikhil Vzo" -> "NV")
  const getMonogram = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean);
    return parts.length > 1 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() 
      : parts[0].substring(0, 2).toUpperCase();
  };

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
                      {item.badge && <span className="nav-badge-soon">{item.badge}</span>}
                    </NavLink>
                  </li>
                ))}
                
                {/* Switch to Admin/HR portal */}
                {isManager && (
                  <li>
                    <NavLink
                      to={isHR ? '/app/admin/placements' : '/app/admin/analytics'}
                      className="nav-link admin-switch-link"
                      onClick={() => {
                        if (window.innerWidth < 768) onClose?.();
                      }}
                      style={{ background: 'rgba(99, 102, 241, 0.06)', color: '#6366f1', border: '1px dashed rgba(99, 102, 241, 0.3)', marginTop: '0.5rem' }}
                    >
                      <span className="nav-icon"><ShieldCheck size={18} strokeWidth={2.5} /></span>
                      <span className="nav-label">{isHR ? 'Recruiter Portal' : 'Admin Console'}</span>
                    </NavLink>
                  </li>
                )}
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
                      {item.badge && <span className="nav-badge-soon">{item.badge}</span>}
                    </NavLink>
                  </li>
                ))}

                {/* Switch back to Student portal */}
                <li>
                  <NavLink
                    to="/app"
                    end
                    className="nav-link student-switch-link"
                    onClick={() => {
                      if (window.innerWidth < 768) onClose?.();
                    }}
                    style={{ background: 'rgba(34, 197, 94, 0.06)', color: '#22c55e', border: '1px dashed rgba(34, 197, 94, 0.3)', marginTop: '0.5rem' }}
                  >
                    <span className="nav-icon"><GraduationCap size={18} strokeWidth={2.5} /></span>
                    <span className="nav-label">Student Portal</span>
                  </NavLink>
                </li>
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
              onClick={() => {
                if (window.innerWidth < 768) onClose?.();
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}

          {/* Mobile responsive profile card + session controls */}
          <div className="sidebar-account-section">
            <div className="sidebar-account-profile">
              <div className="user-monogram">
                {getMonogram(user?.fullName)}
              </div>
              <div className="user-avatar-copy">
                <span className="user-avatar-name">{user?.fullName?.split(' ')[0] || 'User'}</span>
                <span className="user-avatar-role">{user?.roles?.[0] || 'Member'}</span>
              </div>
            </div>
            
            <div className="dropdown-divider" style={{ margin: '0.35rem 0', opacity: 0.5 }} />

            <button
              type="button"
              className="nav-link w-full text-left"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center' }}
              onClick={() => {
                onClose?.();
                navigate('/app/profile');
              }}
            >
              <span className="nav-icon"><Settings size={18} strokeWidth={2.5} /></span>
              <span className="nav-label">Account Settings</span>
            </button>

            <button
              type="button"
              className="nav-link w-full text-left danger"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center' }}
              onClick={handleLogout}
            >
              <span className="nav-icon"><LogOut size={18} strokeWidth={2.5} /></span>
              <span className="nav-label">Terminate Session</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
