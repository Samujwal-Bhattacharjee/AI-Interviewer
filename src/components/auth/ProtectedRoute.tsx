/**
 * src/components/auth/ProtectedRoute.tsx — Phase 4: Route Protection & Role Enforcement.
 * Prevents unauthorized access and keeps student / faculty personas cleanly separated.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'faculty';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-cyan-400 text-xs">
        [VERIFYING ACCESS TOKENS...]
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Role mismatch: redirect to respective authorized dashboard
    if (user.role === 'student') {
      return <Navigate to="/student" replace />;
    } else {
      return <Navigate to="/faculty" replace />;
    }
  }

  return <>{children}</>;
}
