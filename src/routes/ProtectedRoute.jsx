import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';

const ProtectedRoute = () => {
  const location = useLocation();

  // Example: token-based authentication
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
