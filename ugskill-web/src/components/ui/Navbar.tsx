import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { LogOut, Settings, ChevronDown, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { GlobalNotifications } from './GlobalNotifications';
import { Logo } from './Logo';
import './Navbar.css';

interface NavbarProps {
  className?: string;
  onMenuClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ className, onMenuClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate monogram from name (e.g., "Nikhil Vzo" -> "NV")
  const getMonogram = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean);
    return parts.length > 1 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() 
      : parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <nav className={cn('ug-navbar', className)}>
      <div className="navbar-left">
        {onMenuClick && (
          <button 
            type="button"
            className="menu-toggle-btn" 
            onClick={onMenuClick}
            aria-label="Toggle Navigation Menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="navbar-brand">
          <Logo size="sm" showText tone="green" />
        </div>
      </div>

      <div className="navbar-right">
        {/* Global Notifications replaces standard bell */}
        <GlobalNotifications />
        
        <div className="navbar-sep" />

        <div className="user-avatar-wrapper" ref={dropdownRef}>
          <button 
            className="user-avatar-btn"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-expanded={isProfileOpen}
          >
            <div className="user-monogram">
              {getMonogram(user?.fullName)}
            </div>
            <div className="user-avatar-copy">
              <span className="user-avatar-name">{user?.fullName?.split(' ')[0] || 'User'}</span>
              <span className="user-avatar-role">{user?.roles?.[0] || 'Member'}</span>
            </div>
            <ChevronDown 
              size={14} 
              className={cn("user-caret", isProfileOpen && "open")} 
              strokeWidth={3}
            />
          </button>

          {isProfileOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-user-name">{user?.fullName || 'Authorized User'}</div>
                <div className="dropdown-user-role">{user?.email || 'user@ugskill.com'}</div>
                <div className="dropdown-role-badge">
                  {user?.roles?.[0] || 'Member'}
                </div>
              </div>
              
              <button
                className="dropdown-item"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/app/profile');
                }}
              >
                <Settings size={16} />
                <span>Account Settings</span>
              </button>
              
              <div className="dropdown-divider" />
              
              <button className="dropdown-item danger" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Terminate Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
