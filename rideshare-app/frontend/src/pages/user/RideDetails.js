import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Divider,
  Chip,
  Card,
  CardContent,
  Avatar,
  Rating,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import StarIcon from '@mui/icons-material/Star';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PhoneIcon from '@mui/icons-material/Phone';
import MessageIcon from '@mui/icons-material/Message';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import MapComponent from '../../components/map/MapComponent';
import { useRideStore } from '../../store/rideStore';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';

const RideDetails = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { getRideById, currentRide, loading, error, cancelRide, rateRide } = useRideStore();
  
  // Local state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [locationUpdateInterval, setLocationUpdateInterval] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [routePolyline, setRoutePolyline] = useState(null);
  
  // Fetch ride details on mount
  useEffect(() => {
    getRideById(rideId);
    
    // Set up interval to refresh ride data every 15 seconds for active rides
    const intervalId = setInterval(() => {
      getRideById(rideId);
    }, 15000);
    
    setLocationUpdateInterval(intervalId);
    
    return () => {
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
      }
    };
  }, [rideId, getRideById]);
  
  // Update markers when ride data changes
  useEffect(() => {
    if (currentRide) {
      const newMarkers = [];
      
      // Add pickup marker
      if (currentRide.pickup && currentRide.pickup.location) {
        newMarkers.push({
          id: 'pickup',
          position: {
            lat: currentRide.pickup.location.coordinates[1],
            lng: currentRide.pickup.location.coordinates[0]
          },
          title: 'Pickup Location',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
          }
        });
      }
      
      // Add destination marker
      if (currentRide.destination && currentRide.destination.location) {
        newMarkers.push({
          id: 'destination',
          position: {
            lat: currentRide.destination.location.coordinates[1],
            lng: currentRide.destination.location.coordinates[0]
          },
          title: 'Destination',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
          }
        });
      }
      
      // Add driver marker if assigned and location available
      if (
        currentRide.driver &&
        currentRide.driver.currentLocation &&
        currentRide.status !== 'completed' &&
        currentRide.status !== 'cancelled'
      ) {
        newMarkers.push({
          id: 'driver',
          position: {
            lat: currentRide.driver.currentLocation.coordinates[1],
            lng: currentRide.driver.currentLocation.coordinates[0]
          },
          title: `Driver: ${currentRide.driver.user?.name || 'Your Driver'}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          }
        });
      }
      
      setMarkers(newMarkers);
      
      // Calculate route between pickup and destination
      if (
        currentRide.pickup?.location &&
        currentRide.destination?.location &&
        window.google
      ) {
        const directionsService = new window.google.maps.DirectionsService();
        
        directionsService.route(
          {
            origin: {
              lat: currentRide.pickup.location.coordinates[1],
              lng: currentRide.pickup.location.coordinates[0]
            },
            destination: {
              lat: currentRide.destination.location.coordinates[1],
              lng: currentRide.destination.location.coordinates[0]
            },
            travelMode: window.google.maps.TravelMode.DRIVING
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              // Extract route details
              const route = result.routes[0];
              
              // Create polyline for the route
              const path = route.overview_path.map(point => ({
                lat: point.lat(),
                lng: point.lng()
              }));
              
              setRoutePolyline({
                path,
                color: '#4285F4',
                opacity: 0.8,
                weight: 5
              });
            }
          }
        );
      }
    }
  }, [currentRide]);
  
  // Handle ride cancellation
  const handleCancelRide = async () => {
    if (!cancelReason) {
      alert('Please provide a reason for cancellation');
      return;
    }
    
    await cancelRide(rideId, cancelReason);
    setCancelDialogOpen(false);
    setCancelReason('');
  };
  
  // Handle ride rating
  const handleRateRide = async () => {
    await rateRide(rideId, ratingValue, ratingComment);
    setRatingDialogOpen(false);
    setRatingValue(5);
    setRatingComment('');
  };
  
  // Get ride status chip color
  const getRideStatusColor = (status) => {
    switch (status) {
      case 'requested':
        return 'info';
      case 'accepted':
        return 'info';
      case 'arrived':
        return 'secondary';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Get ride status label
  const getRideStatusLabel = (status) => {
    switch (status) {
      case 'requested':
        return 'Requested';
      case 'accepted':
        return 'Driver Assigned';
      case 'arrived':
        return 'Driver Arrived';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };
  
  // Get map center
  const getMapCenter = () => {
    if (!currentRide) return null;
    
    if (
      currentRide.status === 'in_progress' &&
      currentRide.driver?.currentLocation
    ) {
      // Center on driver during ride
      return {
        lat: currentRide.driver.currentLocation.coordinates[1],
        lng: currentRide.driver.currentLocation.coordinates[0]
      };
    } else if (currentRide.pickup?.location && currentRide.destination?.location) {
      // Center between pickup and destination
      return {
        lat: (
          currentRide.pickup.location.coordinates[1] +
          currentRide.destination.location.coordinates[1]
        ) / 2,
        lng: (
          currentRide.pickup.location.coordinates[0] +
          currentRide.destination.location.coordinates[0]
        ) / 2
      };
    } else if (currentRide.pickup?.location) {
      // Center on pickup
      return {
        lat: currentRide.pickup.location.coordinates[1],
        lng: currentRide.pickup.location.coordinates[0]
      };
    }
    
    return null;
  };
  
  // Define ride status steps
  const getStatusSteps = () => [
    {
      label: 'Ride Requested',
      description: 'Your ride request has been submitted.',
      completed: true
    },
    {
      label: 'Driver Assigned',
      description: currentRide?.driver 
        ? `${currentRide.driver.user?.name} is on the way.` 
        : 'A driver has been assigned to your ride.',
      completed: ['accepted', 'arrived', 'in_progress', 'completed'].includes(currentRide?.status)
    },
    {
      label: 'Driver Arrived',
      description: 'Your driver has arrived at the pickup location.',
      completed: ['arrived', 'in_progress', 'completed'].includes(currentRide?.status)
    },
    {
      label: 'Ride in Progress',
      description: 'You are on your way to your destination.',
      completed: ['in_progress', 'completed'].includes(currentRide?.status)
    },
    {
      label: 'Ride Completed',
      description: 'You have arrived at your destination.',
      completed: currentRide?.status === 'completed'
    }
  ];
  
  // Get active step index
  const getActiveStep = () => {
    if (!currentRide) return 0;
    
    switch (currentRide.status) {
      case 'requested':
        return 0;
      case 'accepted':
        return 1;
      case 'arrived':
        return 2;
      case 'in_progress':
        return 3;
      case 'completed':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };
  
  if (loading && !currentRide) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button variant="outlined" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }
  
  if (!currentRide) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" gutterBottom>Ride not found</Typography>
        <Button variant="outlined" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }
  
  const statusSteps = getStatusSteps();
  const activeStep = getActiveStep();
  
  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Ride Details
        </Typography>
        
        <Chip
          label={getRideStatusLabel(currentRide.status)}
          color={getRideStatusColor(currentRide.status)}
          size="medium"
          sx={{ fontSize: '0.9rem', fontWeight: 'medium' }}
        />
      </Box>
      
      <Grid container spacing={4}>
        {/* Left column - Details */}
        <Grid item xs={12} md={5}>
          {/* Ride Progress Stepper */}
          {currentRide.status !== 'cancelled' && (
            <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Stepper activeStep={activeStep} orientation="vertical">
                {statusSteps.map((step, index) => (
                  <Step key={step.label} completed={step.completed}>
                    <StepLabel>
                      <Typography variant="subtitle1">{step.label}</Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                      
                      {/* Estimated arrival time */}
                      {index === 1 && currentRide.status === 'accepted' && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            ETA: {currentRide.estimatedDriverArrival || '5-10 minutes'}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Estimated completion time */}
                      {index === 3 && currentRide.status === 'in_progress' && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            ETA to destination: ~{currentRide.estimatedDuration} minutes
                          </Typography>
                        </Box>
                      )}
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
              
              {/* Cancelled state */}
              {currentRide.status === 'cancelled' && (
                <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
                  <CancelIcon color="error" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="subtitle1" color="error.main">
                      Ride Cancelled
                    </Typography>
                    {currentRide.cancellationReason && (
                      <Typography variant="body2" color="text.secondary">
                        Reason: {currentRide.cancellationReason}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Paper>
          )}
          
          {/* Ride Information */}
          <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Ride Information</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <LocationOnIcon sx={{ color: 'primary.main', mr: 1.5, mt: 0.2 }} />
                  <Box>
                    <Typography variant="subtitle2">Pickup</Typography>
                    <Typography variant="body2">
                      {currentRide.pickup?.address}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <LocationOnIcon sx={{ color: 'secondary.main', mr: 1.5, mt: 0.2 }} />
                  <Box>
                    <Typography variant="subtitle2">Destination</Typography>
                    <Typography variant="body2">
                      {currentRide.destination?.address}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2">Ride ID</Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentRide._id}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2">Date & Time</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(currentRide.requestedAt)} at {formatTime(currentRide.requestedAt)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2">Ride Type</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DirectionsCarIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">
                    {currentRide.rideType.charAt(0).toUpperCase() + currentRide.rideType.slice(1)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2">Distance</Typography>
                <Typography variant="body2">
                  {currentRide.estimatedDistance?.toFixed(1)} km
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1">Fare</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="h6" color="primary.main">
                      {formatCurrency(currentRide.fare?.estimatedFare)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Driver Information */}
          {currentRide.driver && (
            <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>Driver Information</Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={currentRide.driver.user?.profileImage}
                  alt={currentRide.driver.user?.name}
                  sx={{ width: 64, height: 64, mr: 2 }}
                />
                
                <Box>
                  <Typography variant="h6">
                    {currentRide.driver.user?.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StarIcon sx={{ fontSize: 18, color: 'warning.main', mr: 0.5 }} />
                    <Typography variant="body2">
                      {currentRide.driver.rating?.toFixed(1) || '4.9'} ({currentRide.driver.totalRides || '120'} rides)
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Vehicle</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {currentRide.driver.vehicle?.make} {currentRide.driver.vehicle?.model} ({currentRide.driver.vehicle?.year}) - {currentRide.driver.vehicle?.color}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    License Plate: {currentRide.driver.vehicle?.licensePlate}
                  </Typography>
                </Grid>
                
                {(currentRide.status === 'accepted' || currentRide.status === 'arrived' || currentRide.status === 'in_progress') && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<PhoneIcon />}
                        size="small"
                        color="primary"
                        sx={{ mr: 1 }}
                        onClick={() => window.open(`tel:${currentRide.driver.phoneNumber}`)}
                      >
                        Call
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<MessageIcon />}
                        size="small"
                        color="secondary"
                        sx={{ mr: 1 }}
                        onClick={() => window.open(`sms:${currentRide.driver.phoneNumber}`)}
                      >
                        Message
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<SupportAgentIcon />}
                        size="small"
                        color="info"
                        onClick={() => navigate('/support')}
                      >
                        Support
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}
          
          {/* Action Buttons */}
          <Box sx={{ mt: 3 }}>
            {/* Cancel Button - Show only for rides that can be cancelled */}
            {['requested', 'accepted'].includes(currentRide.status) && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setCancelDialogOpen(true)}
                fullWidth
                sx={{ mb: 2 }}
              >
                Cancel Ride
              </Button>
            )}
            
            {/* Rate Button - Show only for completed rides that haven't been rated */}
            {currentRide.status === 'completed' && !currentRide.userRating && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<StarIcon />}
                onClick={() => setRatingDialogOpen(true)}
                fullWidth
                sx={{ mb: 2 }}
              >
                Rate this Ride
              </Button>
            )}
            
            {/* Back to Dashboard */}
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
              fullWidth
            >
              Back to Dashboard
            </Button>
          </Box>
        </Grid>
        
        {/* Right column - Map and Status */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ height: 500 }}>
              <MapComponent
                height="100%"
                width="100%"
                center={getMapCenter()}
                zoom={13}
                markers={markers}
                polyline={routePolyline}
              />
            </Box>
          </Paper>
          
          {/* Rating Card - if ride is completed and rated */}
          {currentRide.status === 'completed' && currentRide.userRating && (
            <Paper elevation={3} sx={{ p: 3, mt: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>Your Rating</Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Rating
                  value={currentRide.userRating.rating}
                  readOnly
                  precision={0.5}
                  emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {currentRide.userRating.rating.toFixed(1)}
                </Typography>
              </Box>
              
              {currentRide.userRating.comment && (
                <Typography variant="body2" color="text.secondary">
                  "{currentRide.userRating.comment}"
                </Typography>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Cancel Ride
          <IconButton
            aria-label="close"
            onClick={() => setCancelDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to cancel this ride?
          </Typography>
          
          <TextField
            autoFocus
            label="Reason for cancellation"
            fullWidth
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            variant="outlined"
            placeholder="Please provide a reason for cancellation"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Back
          </Button>
          <Button 
            onClick={handleCancelRide} 
            variant="contained" 
            color="error"
          >
            Cancel Ride
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Rating Dialog */}
      <Dialog
        open={ratingDialogOpen}
        onClose={() => setRatingDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Rate Your Ride
          <IconButton
            aria-label="close"
            onClick={() => setRatingDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              How was your ride with {currentRide.driver?.user?.name || 'your driver'}?
            </Typography>
            
            <Rating
              name="ride-rating"
              value={ratingValue}
              precision={0.5}
              onChange={(event, newValue) => {
                setRatingValue(newValue);
              }}
              size="large"
              sx={{ fontSize: '2.5rem', my: 2 }}
            />
            
            <TextField
              label="Additional comments (optional)"
              fullWidth
              multiline
              rows={3}
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              variant="outlined"
              placeholder="Share your experience..."
              sx={{ mt: 1 }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setRatingDialogOpen(false)}>
            Skip
          </Button>
          <Button 
            onClick={handleRateRide} 
            variant="contained" 
            color="primary"
            disabled={!ratingValue}
          >
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RideDetails; 