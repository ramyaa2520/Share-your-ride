import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Driver route component that checks if the user is authenticated and is a driver
const DriverRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuthStore();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Redirect to dashboard if authenticated but not a driver
  if (user.role !== 'driver') {
    return <Navigate to="/dashboard" />;
  }

  // Render children if authenticated and is a driver
  return children;
};

export default DriverRoute; 