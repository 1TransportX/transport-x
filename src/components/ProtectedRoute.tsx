
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const { user, profile, isLoading } = useAuth();

  console.log('ProtectedRoute - user:', !!user, 'profile:', !!profile, 'isLoading:', isLoading, 'allowedRoles:', allowedRoles);

  if (isLoading) {
    console.log('ProtectedRoute - showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !profile) {
    console.log('ProtectedRoute - redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    console.log('ProtectedRoute - insufficient permissions, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('ProtectedRoute - rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;
