import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If provided, user must have at least one of these roles to access the route */
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, checkAuth, isLoading, user } = useAuthStore();
  const location = useLocation();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only call checkAuth once per mount, and skip if already authenticated
    if (!hasChecked.current && !isAuthenticated) {
      hasChecked.current = true;
      checkAuth();
    }
  }, [checkAuth, isAuthenticated]);

  // Show loading only if we're actively checking and NOT already authenticated
  if (isLoading && !isAuthenticated) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <div className="text-secondary">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role guard: if allowedRoles specified, verify the user has one of them
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const hasRole = user.roles?.some(r => allowedRoles.includes(r));
    if (!hasRole) {
      // Redirect to appropriate home based on their actual role
      if (user.roles?.includes('admin') || user.roles?.includes('super_admin') || user.roles?.includes('creator')) {
        return <Navigate to="/admin/analytics" replace />;
      }
      return <Navigate to="/app" replace />;
    }
  }

  return <>{children}</>;
};
