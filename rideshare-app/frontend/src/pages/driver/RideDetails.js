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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaymentsIcon from '@mui/icons-material/Payments';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import StarIcon from '@mui/icons-material/Star';
import { toast } from 'react-toastify';

import { useRideStore } from '../../store/rideStore';
import MapComponent from '../../components/map/MapComponent';
import { formatDate, formatTime, formatCurrency, getRideStatusColor } from '../../utils/formatters';

const RideDetails = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { 
    currentRide, 
    getRideById, 
    acceptRide, 
    driverArrived, 
    startRide, 
    completeRide, 
    cancelRide,
    loading, 
    error 
  } = useRideStore();
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  // Fetch ride details on component mount
  useEffect(() => {
    if (rideId) {
      getRideById(rideId);
    }
  }, [getRideById, rideId]);
  
  // Handle going back to ride history
  const handleBack = () => {
    navigate('/driver/rides');
  };
  
  // Handle accepting a ride
  const handleAcceptRide = async () => {
    if (currentRide?._id) {
      await acceptRide(currentRide._id);
    }
  };
  
  // Handle marking arrival at pickup location
  const handleArrived = async () => {
    if (currentRide?._id) {
      await driverArrived(currentRide._id);
    }
  };
  
  // Handle starting a ride
  const handleStartRide = async () => {
    if (currentRide?._id) {
      await startRide(currentRide._id);
    }
  };
  
  // Handle completing a ride
  const handleCompleteRide = async () => {
    if (currentRide?._id) {
      await completeRide(currentRide._id);
    }
  };
  
  // Handle opening cancel dialog
  const handleOpenCancelDialog = () => {
    setCancelDialogOpen(true);
  };
  
  // Handle closing cancel dialog
  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setCancelReason('');
  };
  
  // Handle cancelling a ride
  const handleCancelRide = async () => {
    if (currentRide?._id) {
      if (!cancelReason.trim()) {
        toast.error('Please provide a reason for cancellation');
        return;
      }
      
      await cancelRide(currentRide._id, cancelReason);
      handleCloseCancelDialog();
    }
  };
  
  // If loading and no currentRide, show loading spinner
  if (loading && !currentRide) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If no ride found, show error
  if (!currentRide && !loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Ride not found
          </Typography>
          <Typography variant="body1" paragraph>
            The ride you're looking for doesn't exist or may have been removed.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Ride History
          </Button>
        </Paper>
      </Box>
    );
  }
  
  // Prepare map markers for pickup and destination
  const mapMarkers = [];
  
  if (currentRide?.pickup?.location?.coordinates) {
    mapMarkers.push({
      id: 'pickup',
      position: {
        lat: currentRide.pickup.location.coordinates[1],
        lng: currentRide.pickup.location.coordinates[0]
      },
      title: 'Pickup',
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
      }
    });
  }
  
  if (currentRide?.destination?.location?.coordinates) {
    mapMarkers.push({
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
  
  // Prepare polyline path if both pickup and destination exist
  const polylinePath = [];
  
  if (currentRide?.pickup?.location?.coordinates && currentRide?.destination?.location?.coordinates) {
    polylinePath.push({
      lat: currentRide.pickup.location.coordinates[1],
      lng: currentRide.pickup.location.coordinates[0]
    });
    polylinePath.push({
      lat: currentRide.destination.location.coordinates[1],
      lng: currentRide.destination.location.coordinates[0]
    });
  }
  
  // Render action buttons based on ride status
  const renderActionButtons = () => {
    switch (currentRide.status) {
      case 'requested':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<CheckCircleIcon />}
                onClick={handleAcceptRide}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Accept Ride'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleOpenCancelDialog}
                disabled={loading}
              >
                Decline
              </Button>
            </Grid>
          </Grid>
        );
      
      case 'accepted':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<LocalTaxiIcon />}
                onClick={handleArrived}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Arrived at Pickup'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleOpenCancelDialog}
                disabled={loading}
              >
                Cancel Ride
              </Button>
            </Grid>
          </Grid>
        );
      
      case 'arrived':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<DirectionsCarIcon />}
                onClick={handleStartRide}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Start Ride'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleOpenCancelDialog}
                disabled={loading}
              >
                Cancel Ride
              </Button>
            </Grid>
          </Grid>
        );
      
      case 'in_progress':
        return (
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<CheckCircleIcon />}
            onClick={handleCompleteRide}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Complete Ride'}
          </Button>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Typography variant="h4" component="h1">
              Ride Details
            </Typography>
          </Box>
          
          <Chip
            label={currentRide?.status?.replace('_', ' ')}
            size="medium"
            sx={{
              backgroundColor: getRideStatusColor(currentRide?.status),
              color: '#fff',
              textTransform: 'capitalize',
              px: 1
            }}
          />
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card elevation={1} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ride Information
                </Typography>
                <List disablePadding>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <AccessTimeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Requested At"
                      secondary={`${formatDate(currentRide?.requestedAt)} at ${formatTime(currentRide?.requestedAt)}`}
                    />
                  </ListItem>
                  
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <PaymentsIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Fare"
                      secondary={formatCurrency(currentRide?.fare)}
                    />
                  </ListItem>
                  
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Passenger"
                      secondary={currentRide?.user?.name || 'N/A'}
                    />
                  </ListItem>
                  
                  {currentRide?.rating && (
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <StarIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Rating"
                        secondary={`${currentRide.rating} / 5`}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
            
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Locations
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Pickup Location
                  </Typography>
                  <Typography variant="body2">
                    {currentRide?.pickup?.address || 'N/A'}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Destination
                  </Typography>
                  <Typography variant="body2">
                    {currentRide?.destination?.address || 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 3, width: '100%', height: 350 }}>
              <MapComponent
                markers={mapMarkers}
                polyline={polylinePath.length > 1 ? {
                  path: polylinePath,
                  options: {
                    strokeColor: '#2196F3',
                    strokeOpacity: 0.8,
                    strokeWeight: 4
                  }
                } : null}
                zoom={13}
                center={
                  currentRide?.pickup?.location?.coordinates
                    ? {
                        lat: currentRide.pickup.location.coordinates[1],
                        lng: currentRide.pickup.location.coordinates[0]
                      }
                    : undefined
                }
              />
            </Box>
            
            <Box>
              {renderActionButtons()}
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog}>
        <DialogTitle>
          {currentRide?.status === 'requested' ? 'Decline Ride' : 'Cancel Ride'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {currentRide?.status === 'requested'
              ? 'Please provide a reason for declining this ride request.'
              : 'Please provide a reason for cancelling this ride.'}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Reason"
            fullWidth
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>Cancel</Button>
          <Button 
            onClick={handleCancelRide} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RideDetails; 