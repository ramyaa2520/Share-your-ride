import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Switch,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Stack,
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText,
  List
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HistoryIcon from '@mui/icons-material/History';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import StarIcon from '@mui/icons-material/Star';
import MapComponent from '../../components/map/MapComponent';
import { useAuthStore } from '../../store/authStore';
import { useRideStore } from '../../store/rideStore';
import { useDriverStore } from '../../store/driverStore';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    rides, 
    currentRide, 
    loading: rideLoading, 
    error: rideError, 
    getDriverRides 
  } = useRideStore();
  
  const {
    driverInfo,
    isAvailable,
    earnings,
    loading: driverLoading,
    error: driverError,
    getDriverInfo,
    toggleAvailability
  } = useDriverStore();

  const [recentRides, setRecentRides] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState('pending');

  useEffect(() => {
    // Fetch driver info and rides on component mount
    getDriverInfo();
    getDriverRides();
  }, [getDriverInfo, getDriverRides]);

  useEffect(() => {
    // Get the 5 most recent rides
    if (rides && rides.length > 0) {
      setRecentRides(rides.slice(0, 5));
    }
  }, [rides]);

  useEffect(() => {
    // Check driver verification status
    if (driverInfo) {
      if (driverInfo.drivingLicense?.verified && 
          driverInfo.documents?.some(doc => doc.verified)) {
        setVerificationStatus('verified');
      } else if (driverInfo.documents?.length > 0) {
        setVerificationStatus('pending');
      } else {
        setVerificationStatus('incomplete');
      }
    }
  }, [driverInfo]);

  const handleToggleAvailability = async () => {
    await toggleAvailability();
  };

  const handleViewRideHistory = () => {
    navigate('/driver/ride-history');
  };

  const handleViewEarnings = () => {
    navigate('/driver/earnings');
  };

  const handleViewDocuments = () => {
    navigate('/driver/documents');
  };

  const handleViewProfile = () => {
    navigate('/driver/profile');
  };

  const handleViewRideDetails = (rideId) => {
    navigate(`/driver/rides/${rideId}`);
  };
  
  const handleCreateRideOffer = () => {
    navigate('/driver/create-offer');
  };
  
  const handleViewRideOffers = () => {
    navigate('/driver/my-offers');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format ride date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  // Get verification status color and text
  const getVerificationInfo = () => {
    switch (verificationStatus) {
      case 'verified':
        return { color: 'success', text: 'Verified' };
      case 'pending':
        return { color: 'warning', text: 'Pending Verification' };
      case 'incomplete':
        return { color: 'error', text: 'Documentation Incomplete' };
      default:
        return { color: 'default', text: 'Unknown' };
    }
  };

  const { color: verificationColor, text: verificationText } = getVerificationInfo();

  const loading = rideLoading || driverLoading;
  const error = rideError || driverError;

  if (loading && !driverInfo && !rides) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome, {user?.name}!
      </Typography>

      {/* Driver Status Section */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          bgcolor: isAvailable ? 'success.light' : 'background.paper'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h6" component="div">
                Driver Status:
              </Typography>
              <Switch
                checked={isAvailable}
                onChange={handleToggleAvailability}
                color="primary"
                disabled={verificationStatus !== 'verified' || loading}
              />
              <Typography>
                {isAvailable ? 'Available for Rides' : 'Offline'}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
              <Typography variant="body1">
                Account Status:
              </Typography>
              <Chip
                label={verificationText}
                color={verificationColor}
                variant="outlined"
              />
              {verificationStatus !== 'verified' && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleViewDocuments}
                >
                  Upload Documents
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

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
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={currentRide.user?.name} 
                    secondary={`Phone: ${currentRide.user?.phoneNumber}`} 
                  />
                </ListItem>
                <Divider component="li" variant="inset" />
                <ListItem>
                  <ListItemText 
                    primary="Pickup Location"
                    secondary={currentRide.pickup.address}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <Divider component="li" variant="inset" />
                <ListItem>
                  <ListItemText 
                    primary="Destination"
                    secondary={currentRide.destination.address}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <Divider component="li" variant="inset" />
                <ListItem>
                  <ListItemText 
                    primary="Fare"
                    secondary={`$${currentRide.fare.estimatedFare.toFixed(2)}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" flexDirection="column" height="100%" justifyContent="space-between">
                <Chip 
                  label={formatStatus(currentRide.status)}
                  color="secondary"
                  sx={{ alignSelf: 'flex-start', mb: 2 }}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={() => handleViewRideDetails(currentRide._id)}
                  sx={{ mt: 'auto' }}
                >
                  View Details
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Quick Stats */}
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
            <AttachMoneyIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom align="center">
              Today's Earnings
            </Typography>
            <Typography variant="h4" align="center" color="success.main" sx={{ mb: 2 }}>
              {formatCurrency(earnings?.currentDay || 0)}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleViewEarnings}
              sx={{ mt: 'auto' }}
            >
              View Earnings
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
            <DirectionsCarIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom align="center">
              Completed Rides
            </Typography>
            <Typography variant="h4" align="center" color="primary.main" sx={{ mb: 2 }}>
              {driverInfo?.completedRides || 0}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleViewRideHistory}
              sx={{ mt: 'auto' }}
            >
              View History
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
            <StarIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom align="center">
              Rating
            </Typography>
            <Typography variant="h4" align="center" color="warning.main" sx={{ mb: 2 }}>
              {driverInfo?.ratings?.average?.toFixed(1) || 'N/A'}
              <Typography component="span" variant="body2" color="text.secondary">
                {driverInfo?.ratings?.count ? ` (${driverInfo.ratings.count})` : ''}
              </Typography>
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleViewProfile}
              sx={{ mt: 'auto' }}
            >
              View Profile
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Ride Offers Section */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2
        }}
      >
        <Typography variant="h6" component="div" gutterBottom>
          Ride Offers
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Offer rides to passengers traveling to your destination.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<AddIcon />}
              onClick={handleCreateRideOffer}
              sx={{ height: '100%', minHeight: '50px' }}
            >
              Create New Offer
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              startIcon={<ListIcon />}
              onClick={handleViewRideOffers}
              sx={{ height: '100%', minHeight: '50px' }}
            >
              View My Offers
            </Button>
          </Grid>
        </Grid>
      </Paper>

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
          <Typography>You haven't completed any rides yet.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {recentRides.map((ride) => (
            <Grid item xs={12} key={ride._id}>
              <Card elevation={2}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3} md={2}>
                      <Typography variant="h6">
                        {formatDate(ride.requestedAt)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(ride.requestedAt)}
                      </Typography>
                      <Chip 
                        label={formatStatus(ride.status)}
                        color={getStatusColor(ride.status)}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={7}>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Passenger
                        </Typography>
                        <Typography variant="body1">
                          {ride.user?.name || 'Unknown User'}
                        </Typography>
                      </Box>
                      <Grid container spacing={1}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Pickup
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {ride.pickup.address}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Destination
                          </Typography>
                          <Typography variant="body2">
                            {ride.destination.address}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12} sm={3} md={3}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Fare
                          </Typography>
                          <Typography variant="h6" color="primary.main">
                            ${ride.fare.actualFare || ride.fare.estimatedFare.toFixed(2)}
                          </Typography>
                        </Box>
                        <Button 
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewRideDetails(ride._id)}
                          sx={{ mt: 'auto', alignSelf: 'flex-start' }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Map Section */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Your Current Location
      </Typography>
      <Paper elevation={3} sx={{ p: 2, mb: 4, borderRadius: 2 }}>
        <MapComponent
          height="400px"
          showCurrentLocation={true}
          zoom={14}
        />
      </Paper>
    </Box>
  );
};

export default DriverDashboard; 