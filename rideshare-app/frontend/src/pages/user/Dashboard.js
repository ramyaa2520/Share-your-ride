import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  CircularProgress,
  Stack
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/AddBox';
import MyRidesIcon from '@mui/icons-material/CommuteOutlined';
import MapComponent from '../../components/map/MapComponent';
import { useAuthStore } from '../../store/authStore';
import { useRideStore } from '../../store/rideStore';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    rides, 
    currentRide, 
    loading, 
    error, 
    getUserRides 
  } = useRideStore();
  
  const [activeRide, setActiveRide] = useState(null);
  const [recentRides, setRecentRides] = useState([]);

  useEffect(() => {
    // Fetch user rides data
    getUserRides().then(() => {
      console.log('User rides fetched');
    });
  }, [getUserRides]);

  useEffect(() => {
    // Set current active ride if any
    if (currentRide) {
      setActiveRide(currentRide);
    }
  }, [currentRide]);

  useEffect(() => {
    // Get the 3 most recent rides
    if (rides && rides.length > 0) {
      setRecentRides(rides.slice(0, 3));
    }
  }, [rides]);

  const handleViewRideHistory = () => {
    navigate('/ride-history');
  };

  const handleViewRideDetails = (rideId) => {
    navigate(`/rides/${rideId}`);
  };

  const handleFindRide = () => {
    navigate('/find-ride');
  };
  
  const handleOfferRide = () => {
    navigate('/offer-ride');
  };

  // Format ride date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format ride time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'in_progress':
        return 'primary';
      default:
        return 'default';
    }
  };

  // Format status text
  const formatStatus = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome, {user?.name}!
      </Typography>

      {/* Active Ride Section */}
      {currentRide && (
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            backgroundColor: 'primary.light',
            color: 'white'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Your Current Ride
          </Typography>
          <Chip 
            label={formatStatus(currentRide.status)} 
            color={getStatusColor(currentRide.status)}
            sx={{ 
              mb: 2, 
              color: 'white',
              fontWeight: 'bold',
              '& .MuiChip-label': { px: 2 }
            }} 
          />
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Status: {formatStatus(currentRide.status)}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Driver: {currentRide.driver?.user?.name || 'Finding driver...'}
                </Typography>
                <Typography variant="body1">
                  Pickup: {currentRide.pickup.address}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Destination: {currentRide.destination.address}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Fare: ${currentRide.fare.estimatedFare.toFixed(2)}
                </Typography>
                <Typography variant="body1">
                  Requested at: {formatTime(currentRide.requestedAt)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={() => handleViewRideDetails(currentRide._id)}
              >
                View Details
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2
            }}
          >
            <SearchIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom align="center">
              Find a Ride
            </Typography>
            <Typography variant="body2" align="center" sx={{ mb: 2 }}>
              Looking for someone traveling your way? Find shared rides!
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleFindRide}
              sx={{ mt: 'auto' }}
            >
              Find Rides
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2
            }}
          >
            <AddIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom align="center">
              Offer a Ride
            </Typography>
            <Typography variant="body2" align="center" sx={{ mb: 2 }}>
              Planning a trip? Offer seats in your vehicle!
            </Typography>
            <Button
              variant="contained"
              color="success"
              onClick={handleOfferRide}
              sx={{ mt: 'auto' }}
            >
              Offer Now
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2
            }}
          >
            <HistoryIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom align="center">
              My Rides
            </Typography>
            <Typography variant="body2" align="center" sx={{ mb: 2 }}>
              Manage your offered and requested rides.
            </Typography>
            <Button
              variant="contained"
              color="info"
              onClick={() => navigate('/my-rides')}
              sx={{ mt: 'auto' }}
            >
              View My Rides
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Rides Section */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Recent Rides
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: '#fff9f9' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      ) : recentRides.length === 0 ? (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography>You haven't taken any rides yet.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {recentRides.map((ride) => (
            <Grid item xs={12} md={4} key={ride._id}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6">
                      {formatDate(ride.requestedAt)}
                    </Typography>
                    <Chip 
                      label={formatStatus(ride.status)}
                      color={getStatusColor(ride.status)}
                      size="small"
                    />
                  </Stack>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {formatTime(ride.requestedAt)}
                  </Typography>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>From:</strong> {ride.pickup.address}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>To:</strong> {ride.destination.address}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Fare:</strong> ${ride.fare.actualFare || ride.fare.estimatedFare.toFixed(2)}
                  </Typography>
                  
                  {ride.driver && (
                    <Typography variant="body2">
                      <strong>Driver:</strong> {ride.driver.user.name}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => handleViewRideDetails(ride._id)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Map Section */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Explore Your Area
      </Typography>
      <Paper elevation={3} sx={{ p: 2, mb: 4, borderRadius: 2 }}>
        <MapComponent
          height="400px"
          showCurrentLocation={true}
          zoom={13}
        />
      </Paper>

      {/* Recent Ride Requests */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Recent Ride Requests
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : recentRides.length === 0 ? (
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary">
              You haven't requested any rides yet.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {recentRides.map((ride) => (
              <Grid item xs={12} sm={6} md={4} key={ride.id}>
                <Card elevation={2}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {formatDate(ride.requestedAt).split(',')[0]}
                      </Typography>
                      <Chip 
                        label={formatStatus(ride.status)} 
                        color={getStatusColor(ride.status)}
                        size="small"
                      />
                    </Stack>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>From:</strong> {ride.pickup?.address || 'N/A'}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>To:</strong> {ride.destination?.address || 'N/A'}
                    </Typography>
                    
                    {ride.fare && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Fare:</strong> ₹{ride.fare.estimatedFare?.toFixed(2) || 'N/A'}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => handleViewRideDetails(ride._id || ride.id)}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default UserDashboard; 