import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import TruckLoaderAuthenticating from '../components/Spinner/TruckLoaderAuthenticating';

const ProtectedRoute = () => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <TruckLoaderAuthenticating />;
  }

  if (!isAuthenticated) {
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
