import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  CardActions,
  Grid,
  Divider,
  Button,
  Chip,
  Avatar,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Badge,
  IconButton,
  Rating
} from '@mui/material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTheme } from '@mui/material/styles';
import { toast } from 'react-toastify';

// Icons
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CallIcon from '@mui/icons-material/Call';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import AirlineSeatReclineNormalIcon from '@mui/icons-material/AirlineSeatReclineNormal';
import TripOriginIcon from '@mui/icons-material/TripOrigin';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

import { useRideStore } from '../../store/rideStore';
import { useAuthStore } from '../../store/authStore';
import MapComponent from '../../components/map/MapComponent';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rides-tabpanel-${index}`}
      aria-labelledby={`rides-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DisplayJoinRequests = ({ requests, rideOffer, onAccept, onReject }) => {
  const getRequestStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };
  
  const getRequestStatusLabel = (status) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };
  
  return (
    <List dense sx={{ maxHeight: 240, overflow: 'auto' }}>
      {requests.map((request) => (
        <ListItem
          key={request.id}
          secondaryAction={
            request.status === 'pending' ? (
              <Stack direction="row" spacing={1}>
                <IconButton
                  edge="end"
                  color="success"
                  onClick={() => onAccept(request, rideOffer)}
                >
                  <CheckIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  color="error"
                  onClick={() => onReject(request, rideOffer)}
                >
                  <CloseIcon />
                </IconButton>
              </Stack>
            ) : (
              <Chip
                label={getRequestStatusLabel(request.status)}
                color={getRequestStatusColor(request.status)}
                size="small"
              />
            )
          }
        >
          <ListItemAvatar>
            <Avatar>
              <PersonIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={request.user?.name || 'Anonymous'}
            secondary={
              <React.Fragment>
                <Typography variant="body2" component="span" display="block">
                  Seats: {request.seatsRequired}
                </Typography>
                {request.status === 'accepted' && request.user?.phoneNumber && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" component="span">
                      Contact: {request.user.phoneNumber}
                    </Typography>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      component="a" 
                      href={`tel:${request.user.phoneNumber}`}
                    >
                      <CallIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )}
              </React.Fragment>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

const RideCard = ({ ride, type, onAction, actionText, actionIcon, secondaryAction, requestStatus }) => {
  const theme = useTheme();
  
  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  const formatDate = (dateStr) => {
    return dayjs(dateStr).format('ddd, MMM D, YYYY');
  };
  
  const formatTime = (dateStr) => {
    return dayjs(dateStr).format('h:mm A');
  };
  
  const formatPrice = (price) => {
    return `₹${Number(price).toFixed(2)}`;
  };
  
  const getRequestStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };
  
  const getRequestStatusLabel = (status) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };
  
  const requestColor = getRequestStatusColor(requestStatus);
  
  return (
    <Card elevation={3}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6" color="text.primary" fontWeight="medium">
            {ride.departureAddress || ride.departure.address} → {ride.destinationAddress || ride.destination.address}
          </Typography>
          <Chip 
            label={formatPrice(ride.price)} 
            color="primary" 
            variant="outlined"
          />
        </Stack>
        
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <EventIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {formatDate(ride.departureTime)} at {formatTime(ride.departureTime)}
          </Typography>
        </Stack>
        
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <PersonIcon fontSize="small" color="action" />
          <Typography variant="body2">
            Driver: {ride.driver?.name || 'Unknown'}
          </Typography>
        </Stack>

        {requestStatus === 'accepted' && ride.driver?.phoneNumber && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <PhoneIcon fontSize="small" color="action" />
            <Typography variant="body2">
              Contact: {ride.driver.phoneNumber}
            </Typography>
            <IconButton 
              size="small" 
              color="primary" 
              component="a" 
              href={`tel:${ride.driver.phoneNumber}`}
            >
              <CallIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}
        
        <Box sx={{ mt: 1 }}>
          <Chip 
            label={getRequestStatusLabel(requestStatus)} 
            color={requestColor} 
            size="small" 
            sx={{ mr: 1 }}
          />
          
          <Chip
            icon={<AirlineSeatReclineNormalIcon />}
            label={`${ride.availableSeats} seats`}
            variant="outlined"
            size="small"
          />
        </Box>
      </CardContent>
      
      <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={actionIcon}
          onClick={() => onAction(ride.id)}
        >
          {actionText}
        </Button>
        
        {secondaryAction}
      </CardActions>
    </Card>
  );
};

const MyRides = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { 
    myOfferedRides, 
    myRequestedRides, 
    getMyOfferedRides, 
    getMyRequestedRides, 
    acceptJoinRequest, 
    rejectJoinRequest, 
    cancelRideRequest,
    getUserRides,
    getMyRideOffers,
    loading, 
    error,
    respondToPassengerRequest
  } = useRideStore();
  
  const [tabValue, setTabValue] = useState(0);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const [rides, setRides] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setError] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancellingRideId, setCancellingRideId] = useState(null);
  const [respondingToRide, setRespondingToRide] = useState(null);
  const [respondingToPassenger, setRespondingToPassenger] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });
  
  // Fetch rides and ride offers when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setLocalLoading(true); // Set both loading states
      setError('');
      
      try {
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
          // Try to restore from session storage
          const backupToken = sessionStorage.getItem('backup_token');
          if (backupToken) {
            localStorage.setItem('token', backupToken);
            sessionStorage.removeItem('backup_token');
            console.log('Restored token from session storage');
          } else {
            setError('You must be logged in to view your rides');
            setIsLoading(false);
            setLocalLoading(false);
            toast.error('Authentication required. Please log in.');
            navigate('/login');
            return;
          }
        }
        
        console.log('Fetching rides data with token:', token ? token.substring(0, 15) + '...' : 'None');
        
        // Use Promise.all to fetch both sets of data concurrently
        const [rideData, offerData] = await Promise.all([
          getUserRides(),
          getMyRideOffers()
        ]);
        
        console.log('Ride data received:', rideData);
        console.log('Offer data received:', offerData);
        
        // Sort rides and offers by departure time (most recent first)
        const sortedRides = Array.isArray(rideData) ? 
          rideData.sort((a, b) => new Date(b.departureTime || 0) - new Date(a.departureTime || 0)) : 
          [];
          
        const sortedOffers = Array.isArray(offerData) ? 
          offerData.sort((a, b) => new Date(b.departureTime || 0) - new Date(a.departureTime || 0)) : 
          [];
        
        setRides(sortedRides);
        setMyOffers(sortedOffers);
        
        // Update the store's myOfferedRides if needed
        if (sortedOffers.length > 0 && (!myOfferedRides || myOfferedRides.length === 0)) {
          // This is a side effect, but it ensures the data is consistently available
          getMyOfferedRides();
        }
        
        console.log(`Fetched ${sortedRides.length} rides and ${sortedOffers.length} offers`);
      } catch (err) {
        console.error('Error fetching rides:', err);
        
        // Handle authentication errors specifically
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setError('Authentication failed. Please log in again.');
          toast.error('Your session has expired. Please log in again.');
          navigate('/login');
        } else {
          setError('Failed to load rides. Please try again.');
          toast.error('Error loading rides');
        }
      } finally {
        setIsLoading(false);
        setLocalLoading(false);
      }
    };
    
    fetchData();
  }, [getUserRides, getMyRideOffers, getMyOfferedRides, myOfferedRides, navigate]);
  
  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary" sx={{ mt: 3 }}>
          Loading your rides...
        </Typography>
      </Box>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => {
            setLocalLoading(true);
            Promise.all([
              getMyOfferedRides(),
              getMyRequestedRides()
            ]).then(() => {
              setLocalLoading(false);
            }).catch(() => {
              setLocalLoading(false);
            });
          }}
        >
          Try Again
        </Button>
      </Box>
    );
  }
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleViewRideDetails = (rideId) => {
    console.log('Viewing ride details for ID:', rideId);
    // Ensure we have a valid ID before navigating
    if (!rideId) {
      console.error('Missing ride ID');
      return;
    }
    
    // Let's directly use the ride ID we have
    const actualId = typeof rideId === 'object' ? (rideId._id || rideId.id) : rideId;
    
    // Save the current auth token to session storage as a backup
    // This ensures it persists through the navigation even if localStorage is cleared
    const token = localStorage.getItem('token');
    if (token) {
      sessionStorage.setItem('backup_token', token);
    }
    
    // Navigate with the token preserved
    navigate(`/rides/${actualId}`, { 
      state: { 
        previousPage: 'myrides', 
        preserveAuth: true,
        token: token // Also pass token in state as an extra precaution
      } 
    });
  };
  
  const handleOpenAcceptDialog = (request) => {
    setSelectedRequest(request);
    setAcceptDialogOpen(true);
  };
  
  const handleOpenRejectDialog = (request) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };
  
  const handleOpenCancelDialog = (request) => {
    setSelectedRequest(request);
    setCancelDialogOpen(true);
  };
  
  const handleCloseDialogs = () => {
    setAcceptDialogOpen(false);
    setRejectDialogOpen(false);
    setCancelDialogOpen(false);
  };
  
  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;
    
    setActionLoading(true);
    
    try {
      await acceptJoinRequest(selectedRequest.rideId, selectedRequest.id);
      handleCloseDialogs();
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    
    setActionLoading(true);
    
    try {
      await rejectJoinRequest(selectedRequest.rideId, selectedRequest.id);
      handleCloseDialogs();
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleCancelRequest = async () => {
    if (!selectedRequest) return;
    
    setActionLoading(true);
    
    try {
      await cancelRideRequest(selectedRequest.rideId, selectedRequest.id);
      handleCloseDialogs();
    } catch (error) {
      console.error('Error canceling request:', error);
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleViewDetails = (ride) => {
    setSelectedRide(ride);
    setDetailsOpen(true);
    
    // Set markers for the map
    if (ride.pickup?.location?.coordinates && ride.destination?.location?.coordinates) {
      const pickupCoords = ride.pickup.location.coordinates;
      const destCoords = ride.destination.location.coordinates;
      
      const newMarkers = [
        {
          id: 'pickup',
          position: { 
            lat: pickupCoords[1], 
            lng: pickupCoords[0] 
          },
          title: 'Pickup',
          info: ride.pickup.address || 'Pickup location'
        },
        {
          id: 'destination',
          position: { 
            lat: destCoords[1], 
            lng: destCoords[0] 
          },
          title: 'Destination',
          info: ride.destination.address || 'Destination location'
        }
      ];
      
      setMarkers(newMarkers);
      setMapCenter({ lat: pickupCoords[1], lng: pickupCoords[0] });
      
      // Calculate route
      calculateRoute(
        { lat: pickupCoords[1], lng: pickupCoords[0] },
        { lat: destCoords[1], lng: destCoords[0] }
      );
    }
  };
  
  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedRide(null);
    setMarkers([]);
    setRoutePolyline(null);
  };
  
  const calculateRoute = async (pickup, destination) => {
    try {
      const response = await fetch(
        `https://api.locationiq.com/v1/directions/driving/` +
        `${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}` +
        `?key=pk.c61dfc5608103dcf469a185a22842c95&steps=false&overview=full&geometries=geojson`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRoutePolyline(route.geometry);
      } else {
        console.error('No route found');
        setRoutePolyline(null);
      }
    } catch (err) {
      console.error('Error calculating route:', err);
      setRoutePolyline(null);
    }
  };
  
  const handleCancelRide = async (rideId) => {
    try {
      setCancellingRideId(rideId);
      await cancelRideRequest(rideId);
      fetchRides(); // Refresh the rides list
    } catch (error) {
      console.error('Error cancelling ride:', error);
    } finally {
      setCancellingRideId(null);
    }
  };
  
  const handleRespondToRequest = async (rideId, passengerId, status) => {
    try {
      setRespondingToRide(rideId);
      setRespondingToPassenger(passengerId);
      await respondToPassengerRequest(rideId, passengerId, status);
      fetchRides(); // Refresh the rides list
    } catch (error) {
      console.error('Error responding to request:', error);
    } finally {
      setRespondingToRide(null);
      setRespondingToPassenger(null);
    }
  };
  
  const formatDate = (dateStr) => {
    return dayjs(dateStr).format('ddd, MMM D, YYYY');
  };
  
  const formatTime = (dateStr) => {
    return dayjs(dateStr).format('h:mm A');
  };
  
  const formatTimeSince = (dateStr) => {
    if (!dateStr) return 'N/A';
    return dayjs(dateStr).fromNow();
  };
  
  const getRideStatusChip = (status) => {
    let color = 'default';
    let label = status;
    
    switch (status) {
      case 'searching_driver':
        color = 'info';
        label = 'Looking for traveler';
        break;
      case 'driver_assigned':
        color = 'primary';
        label = 'Traveler assigned';
        break;
      case 'driver_arrived':
        color = 'secondary';
        label = 'Traveler arrived';
        break;
      case 'requested':
        color = 'warning';
        label = 'Requested';
        break;
      case 'in_progress':
        color = 'warning';
        label = 'In progress';
        break;
      case 'completed':
        color = 'success';
        label = 'Completed';
        break;
      case 'cancelled':
        color = 'error';
        label = 'Cancelled';
        break;
      case 'pending':
        color = 'warning';
        label = 'Pending';
        break;
      case 'accepted':
        color = 'success';
        label = 'Accepted';
        break;
      case 'rejected':
        color = 'error';
        label = 'Rejected';
        break;
      default:
        color = 'default';
        label = status;
    }
    
    return <Chip size="small" color={color} label={label} />;
  };
  
  // Filter rides based on tab
  const getFilteredRides = () => {
    if (!rides || !rides.length) return [];
    
    switch (tabValue) {
      case 0: // All rides
        return rides;
      case 1: // Active rides (requested, assigned, in progress)
        return rides.filter(ride => 
          ['requested', 'searching_driver', 'driver_assigned', 'driver_arrived', 'in_progress'].includes(ride.status)
        );
      case 2: // Completed rides
        return rides.filter(ride => ride.status === 'completed');
      case 3: // Cancelled rides
        return rides.filter(ride => ride.status === 'cancelled');
      default:
        return rides;
    }
  };
  
  const filteredRides = getFilteredRides();
  
  // Handle rides with passenger requests (for ride owners)
  const hasPassengerRequests = (ride) => {
    return ride.passengers && ride.passengers.some(p => p.status === 'pending');
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        My Rides
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="All Rides" />
          <Tab label="Active" />
          <Tab label="Completed" />
          <Tab label="Cancelled" />
        </Tabs>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredRides.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">No rides found</Typography>
          <Typography variant="body1" color="text.secondary">
            You don't have any {tabValue === 0 ? '' : tabValue === 1 ? 'active' : tabValue === 2 ? 'completed' : 'cancelled'} rides yet.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredRides.map(ride => (
            <Grid item xs={12} md={6} key={ride._id || ride.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    {getRideStatusChip(ride.status)}
                    <Typography variant="caption" color="text.secondary">
                      {formatTimeSince(ride.requestedAt)}
                    </Typography>
                  </Stack>
                  
                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                      <TripOriginIcon color="primary" fontSize="small" />
                      <Typography variant="body2" noWrap title={ride.pickup?.address}>
                        {ride.pickup?.address}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FmdGoodIcon color="error" fontSize="small" />
                      <Typography variant="body2" noWrap title={ride.destination?.address}>
                        {ride.destination?.address}
                      </Typography>
                    </Stack>
                  </Box>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CurrencyRupeeIcon fontSize="small" />
                      <Typography variant="body1" fontWeight="bold">
                        ₹{ride.fare?.estimatedFare?.toFixed(2)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AirlineSeatReclineNormalIcon fontSize="small" />
                      <Typography variant="body2">
                        {ride.availableSeats || '1'} seat(s)
                      </Typography>
                    </Stack>
                  </Stack>
                  
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {ride.estimatedDistance?.toFixed(1)} km
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ~{Math.round(ride.estimatedDuration || 0)} min
                    </Typography>
                  </Stack>
                  
                  {/* Display pending passenger requests notification */}
                  {hasPassengerRequests(ride) && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      {ride.passengers.filter(p => p.status === 'pending').length} pending request(s)
                    </Alert>
                  )}
                </CardContent>
                
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Stack direction="row" spacing={1} width="100%">
                    <Button 
                      variant="outlined"
                      sx={{ flex: 1 }}
                      onClick={() => handleViewDetails(ride)}
                    >
                      Details
                    </Button>
                    
                    {/* Only show cancel button for pending/active rides */}
                    {['requested', 'searching_driver', 'driver_assigned'].includes(ride.status) && (
                      <Button 
                        variant="contained"
                        color="error"
                        sx={{ flex: 1 }}
                        onClick={() => handleCancelRide(ride._id || ride.id)}
                        disabled={loading || cancellingRideId === (ride._id || ride.id)}
                        startIcon={cancellingRideId === (ride._id || ride.id) ? <CircularProgress size={20} /> : <CancelIcon />}
                      >
                        Cancel
                      </Button>
                    )}
                  </Stack>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Ride Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        {selectedRide && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Ride Details</Typography>
                <IconButton onClick={handleCloseDetails}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Route Information
                  </Typography>
                  
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TripOriginIcon color="primary" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Pickup Location
                          </Typography>
                          <Typography variant="body1">
                            {selectedRide.pickup?.address}
                          </Typography>
                        </Box>
                      </Stack>
                      
                      <Stack direction="row" spacing={1} alignItems="center">
                        <FmdGoodIcon color="error" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Destination
                          </Typography>
                          <Typography variant="body1">
                            {selectedRide.destination?.address}
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </Paper>
                  
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Ride Details
                  </Typography>
                  
                  <Paper sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Status
                        </Typography>
                        {getRideStatusChip(selectedRide.status)}
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Ride Type
                        </Typography>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                          {selectedRide.rideType || 'Standard'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Distance
                        </Typography>
                        <Typography variant="body1">
                          {selectedRide.estimatedDistance?.toFixed(1)} km
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Duration
                        </Typography>
                        <Typography variant="body1">
                          ~{Math.round(selectedRide.estimatedDuration || 0)} minutes
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Estimated Fare
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          ₹{selectedRide.fare?.estimatedFare?.toFixed(2)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Available Seats
                        </Typography>
                        <Typography variant="body1">
                          {selectedRide.availableSeats || '1'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Requested
                        </Typography>
                        <Typography variant="body1">
                          {formatTimeSince(selectedRide.requestedAt)}
                        </Typography>
                      </Grid>
                      
                      {selectedRide.vehicle && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Vehicle
                          </Typography>
                          <Typography variant="body1">
                            {selectedRide.vehicle.model} • {selectedRide.vehicle.color}
                          </Typography>
                          <Typography variant="body2" fontWeight="medium" color="primary">
                            {selectedRide.vehicle.licensePlate}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                  
                  {/* Show requestor info if this is not user's ride */}
                  {selectedRide.user && selectedRide.user._id !== (localStorage.getItem('userId') || '') && (
                    <>
                      <Typography variant="subtitle1" fontWeight="bold" mt={2} gutterBottom>
                        Requester Information
                      </Typography>
                      
                      <Paper sx={{ p: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar>
                            {selectedRide.user.name?.charAt(0) || <PersonIcon />}
                          </Avatar>
                          <Box>
                            <Typography variant="body1">
                              {selectedRide.user.name}
                            </Typography>
                            
                            {/* Display phone number if available */}
                            {selectedRide.user.phoneNumber && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <PhoneIcon fontSize="small" />
                                <Typography variant="body2">
                                  <a href={`tel:${selectedRide.user.phoneNumber}`}>
                                    {selectedRide.user.phoneNumber}
                                  </a>
                                </Typography>
                              </Stack>
                            )}
                            
                            {selectedRide.user.ratings?.average > 0 && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Rating 
                                  value={selectedRide.user.ratings.average} 
                                  precision={0.5} 
                                  size="small" 
                                  readOnly 
                                />
                                <Typography variant="body2" color="text.secondary">
                                  ({selectedRide.user.ratings.count})
                                </Typography>
                              </Stack>
                            )}
                          </Box>
                        </Stack>
                      </Paper>
                    </>
                  )}
                  
                  {/* Show passenger requests if this is user's ride */}
                  {selectedRide.passengers && selectedRide.passengers.length > 0 && (
                    <>
                      <Typography variant="subtitle1" fontWeight="bold" mt={2} gutterBottom>
                        Passenger Requests
                      </Typography>
                      
                      {selectedRide.passengers.map(passenger => (
                        <Paper sx={{ p: 2, mb: 2 }} key={passenger.user._id || passenger.user}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar>
                                {passenger.user.name?.charAt(0) || <PersonIcon />}
                              </Avatar>
                              <Box>
                                <Typography variant="body1">
                                  {passenger.user.name}
                                </Typography>
                                
                                {/* Display phone number if available */}
                                {passenger.user.phoneNumber && (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <PhoneIcon fontSize="small" />
                                    <Typography variant="body2">
                                      <a href={`tel:${passenger.user.phoneNumber}`}>
                                        {passenger.user.phoneNumber}
                                      </a>
                                    </Typography>
                                  </Stack>
                                )}
                                
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <AccessTimeIcon fontSize="small" />
                                  <Typography variant="caption" color="text.secondary">
                                    Requested {formatTimeSince(passenger.requestedAt)}
                                  </Typography>
                                </Stack>
                              </Box>
                            </Stack>
                            
                            {getRideStatusChip(passenger.status)}
                          </Stack>
                          
                          {/* Show accept/reject buttons for pending requests */}
                          {passenger.status === 'pending' && (
                            <Stack direction="row" spacing={1} mt={2} justifyContent="flex-end">
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleRespondToRequest(selectedRide._id, passenger.user._id, 'rejected')}
                                disabled={respondingToRide === selectedRide._id && respondingToPassenger === passenger.user._id}
                                startIcon={<CancelIcon />}
                              >
                                Reject
                              </Button>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() => handleRespondToRequest(selectedRide._id, passenger.user._id, 'accepted')}
                                disabled={respondingToRide === selectedRide._id && respondingToPassenger === passenger.user._id}
                                startIcon={<CheckCircleIcon />}
                              >
                                Accept
                              </Button>
                            </Stack>
                          )}
                        </Paper>
                      ))}
                    </>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Route Map
                  </Typography>
                  
                  <Paper sx={{ p: 0, overflow: 'hidden', height: 400 }}>
                    <MapComponent
                      markers={markers}
                      polyline={routePolyline}
                      center={mapCenter}
                      zoom={10}
                    />
                  </Paper>
                  
                  <Typography variant="subtitle1" fontWeight="bold" mt={2} gutterBottom>
                    Fare Breakdown
                  </Typography>
                  
                  <Paper sx={{ p: 2 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={8}>
                        <Typography variant="body2">Base Fare</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" align="right">
                          ₹{selectedRide.fare?.breakdown?.baseFare?.toFixed(2)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={8}>
                        <Typography variant="body2">Distance Fare</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" align="right">
                          ₹{selectedRide.fare?.breakdown?.distanceFare?.toFixed(2)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={8}>
                        <Typography variant="body2">Time Fare</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" align="right">
                          ₹{selectedRide.fare?.breakdown?.timeFare?.toFixed(2)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={8}>
                        <Typography variant="body2">Tax</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" align="right">
                          ₹{selectedRide.fare?.breakdown?.tax?.toFixed(2)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      
                      <Grid item xs={8}>
                        <Typography variant="body1" fontWeight="bold">
                          Total Fare
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body1" fontWeight="bold" align="right">
                          ₹{selectedRide.fare?.estimatedFare?.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={handleCloseDetails} variant="outlined">
                Close
              </Button>
              
              {/* Show cancel button for active rides */}
              {['requested', 'searching_driver', 'driver_assigned'].includes(selectedRide.status) && (
                <Button 
                  variant="contained" 
                  color="error"
                  onClick={() => handleCancelRide(selectedRide._id || selectedRide.id)}
                  disabled={loading || cancellingRideId === (selectedRide._id || selectedRide.id)}
                  startIcon={cancellingRideId === (selectedRide._id || selectedRide.id) ? <CircularProgress size={20} /> : <CancelIcon />}
                >
                  Cancel Ride
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default MyRides; 