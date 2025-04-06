import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Protected route component that checks if the user is authenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();

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

  // Render children if authenticated
  return children;
};

export default ProtectedRoute; 