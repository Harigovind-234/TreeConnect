import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader message="Verifying security credentials..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect user to their own valid dashboard if trying to access unauthorized area
    const userRole = user?.role;
    let fallbackPath = '/';
    if (userRole === 'admin') fallbackPath = '/admin/dashboard';
    else if (userRole === 'landowner') fallbackPath = '/landowner/dashboard';
    else if (userRole === 'contractor') fallbackPath = '/contractor/dashboard';
    else if (userRole === 'buyer') fallbackPath = '/buyer/dashboard';

    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
