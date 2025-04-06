import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Layout components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DriverRoute from './components/auth/DriverRoute';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DriverSignup from './pages/auth/DriverSignup';

// User pages
import Home from './pages/Home';
import UserDashboard from './pages/user/Dashboard';
import RideHistory from './pages/user/RideHistory';
import RideDetails from './pages/user/RideDetails';
import Profile from './pages/user/Profile';
import RideOffers from './pages/user/RideOffers';
import FindRide from './pages/user/FindRide';
import OfferRide from './pages/user/OfferRide';
import MyRides from './pages/user/MyRides';

// Driver pages
import DriverDashboard from './pages/driver/Dashboard';
import DriverRideHistory from './pages/driver/RideHistory';
import DriverRideDetails from './pages/driver/RideDetails';
import DriverProfile from './pages/driver/Profile';
import DriverDocuments from './pages/driver/Documents';
import DriverEarnings from './pages/driver/Earnings';
import CreateRideOffer from './pages/driver/CreateRideOffer';
import MyRideOffers from './pages/driver/MyRideOffers';

// Store
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  useEffect(() => {
    // Check if user is authenticated on app load
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Restore token from session storage if it exists
    const backupToken = sessionStorage.getItem('backup_token');
    const currentToken = localStorage.getItem('token');
    
    if (backupToken && !currentToken) {
      console.log('Restoring authentication token from backup');
      localStorage.setItem('token', backupToken);
      // Clear the backup after restoring
      sessionStorage.removeItem('backup_token');
    }
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to={user?.role === 'driver' ? '/driver/dashboard' : '/dashboard'} /> : <Login />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to={user?.role === 'driver' ? '/driver/dashboard' : '/dashboard'} /> : <Register />
      } />

      {/* User routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        
        {/* Protected user routes */}
        <Route path="dashboard" element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } />
        <Route path="find-ride" element={
          <ProtectedRoute>
            <FindRide />
          </ProtectedRoute>
        } />
        <Route path="offer-ride" element={
          <ProtectedRoute>
            <OfferRide />
          </ProtectedRoute>
        } />
        <Route path="my-rides" element={
          <ProtectedRoute>
            <MyRides />
          </ProtectedRoute>
        } />
        <Route path="ride-history" element={
          <ProtectedRoute>
            <RideHistory />
          </ProtectedRoute>
        } />
        <Route path="rides/:rideId" element={
          <ProtectedRoute>
            <RideDetails />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="ride-offers" element={
          <ProtectedRoute>
            <RideOffers />
          </ProtectedRoute>
        } />
        
        {/* Driver signup (accessible to logged-in users) */}
        <Route path="become-driver" element={
          <ProtectedRoute>
            <DriverSignup />
          </ProtectedRoute>
        } />
        
        {/* Driver routes */}
        <Route path="driver/dashboard" element={
          <DriverRoute>
            <DriverDashboard />
          </DriverRoute>
        } />
        <Route path="driver/ride-history" element={
          <DriverRoute>
            <DriverRideHistory />
          </DriverRoute>
        } />
        <Route path="driver/rides/:rideId" element={
          <DriverRoute>
            <DriverRideDetails />
          </DriverRoute>
        } />
        <Route path="driver/profile" element={
          <DriverRoute>
            <DriverProfile />
          </DriverRoute>
        } />
        <Route path="driver/documents" element={
          <DriverRoute>
            <DriverDocuments />
          </DriverRoute>
        } />
        <Route path="driver/earnings" element={
          <DriverRoute>
            <DriverEarnings />
          </DriverRoute>
        } />
        <Route path="driver/create-offer" element={
          <DriverRoute>
            <CreateRideOffer />
          </DriverRoute>
        } />
        <Route path="driver/my-offers" element={
          <DriverRoute>
            <MyRideOffers />
          </DriverRoute>
        } />
      </Route>

      {/* 404 - Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App; 