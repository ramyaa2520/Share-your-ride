import React, { useState, useEffect } from 'react';
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
  IconButton
} from '@mui/material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTheme } from '@mui/material/styles';

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

import { useRideStore } from '../../store/rideStore';

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
  const { 
    myOfferedRides, 
    myRequestedRides, 
    getMyOfferedRides, 
    getMyRequestedRides, 
    acceptJoinRequest, 
    rejectJoinRequest, 
    cancelRideRequest,
    loading, 
    error 
  } = useRideStore();
  
  const [tabValue, setTabValue] = useState(0);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  useEffect(() => {
    // Fetch offered and requested rides on component mount
    getMyOfferedRides();
    getMyRequestedRides();
  }, [getMyOfferedRides, getMyRequestedRides]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleViewRideDetails = (rideId) => {
    navigate(`/rides/${rideId}`);
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
  
  const formatDate = (dateStr) => {
    return dayjs(dateStr).format('ddd, MMM D, YYYY');
  };
  
  const formatTime = (dateStr) => {
    return dayjs(dateStr).format('h:mm A');
  };
  
  const getPendingRequestsCount = (ride) => {
    if (!ride.joinRequests) return 0;
    return ride.joinRequests.filter(req => req.status === 'pending').length;
  };
  
  // Update price display to use Indian Rupees
  const formatPrice = (price) => {
    return `₹${Number(price).toFixed(2)}`;
  };
  
  // Render the offered rides
  const renderOfferedRides = () => {
    if (loading && (!myOfferedRides || !myOfferedRides.length)) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (!myOfferedRides || !myOfferedRides.length) {
      return (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            You haven't offered any rides yet
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Share your journey with others by offering a ride.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/offer-ride')}
          >
            Offer a Ride
          </Button>
        </Paper>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {myOfferedRides.map((ride) => (
          <Grid item xs={12} key={ride.id}>
            <Card elevation={3}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" fontWeight="medium" color="text.primary">
                        {ride.departureAddress || ride.departure.address} → {ride.destinationAddress || ride.destination.address}
                      </Typography>
                      
                      <Badge 
                        badgeContent={getPendingRequestsCount(ride)} 
                        color="warning"
                        showZero={false}
                      >
                        <Chip 
                          label={<Typography variant="h6" color="primary" fontWeight="bold">{formatPrice(ride.price)}</Typography>} 
                          color="primary" 
                          variant="outlined"
                        />
                      </Badge>
                    </Stack>
                    
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {formatDate(ride.departureTime)} at {formatTime(ride.departureTime)}
                      </Typography>
                    </Stack>
                    
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" noWrap>
                        From: {ride.departure.address}
                      </Typography>
                    </Stack>
                    
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" noWrap>
                        To: {ride.destination.address}
                      </Typography>
                    </Stack>
                    
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Available Seats:</strong> {ride.availableSeats}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Vehicle:</strong> {ride.vehicle?.model || 'N/A'} {ride.vehicle?.color ? `(${ride.vehicle.color})` : ''}
                      </Typography>
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Join Requests ({ride.joinRequests?.length || 0})
                    </Typography>
                    
                    {!ride.joinRequests || ride.joinRequests.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No join requests yet.
                      </Typography>
                    ) : (
                      <DisplayJoinRequests 
                        requests={ride.joinRequests}
                        rideOffer={ride}
                        onAccept={handleOpenAcceptDialog}
                        onReject={handleOpenRejectDialog}
                      />
                    )}
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleViewRideDetails(ride.id)}
                >
                  View Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Render the requested rides
  const renderRequestedRides = () => {
    if (loading && (!myRequestedRides || !myRequestedRides.length)) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (!myRequestedRides || !myRequestedRides.length) {
      return (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            You haven't requested any rides yet
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Find a ride that matches your travel plans.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/find-ride')}
          >
            Find a Ride
          </Button>
        </Paper>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {myRequestedRides.map((request) => (
          <Grid item xs={12} md={6} key={request.id}>
            <RideCard 
              ride={request.ride}
              type="userRequest"
              onAction={handleViewRideDetails}
              actionText="View Ride Details"
              actionIcon={<LocationOnIcon />}
              secondaryAction={
                request.status === 'pending' && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleOpenCancelDialog(request)}
                  >
                    Cancel Request
                  </Button>
                )
              }
              requestStatus={request.status}
            />
          </Grid>
        ))}
      </Grid>
    );
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        My Rides
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Rides I'm Offering" />
          <Tab label="Rides I've Requested" />
        </Tabs>
      </Paper>
      
      <TabPanel value={tabValue} index={0}>
        {renderOfferedRides()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {renderRequestedRides()}
      </TabPanel>
      
      {/* Accept Request Dialog */}
      <Dialog open={acceptDialogOpen} onClose={handleCloseDialogs}>
        <DialogTitle>Accept Join Request</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to accept {selectedRequest?.user?.name}'s request for {selectedRequest?.seats} {selectedRequest?.seats === 1 ? 'seat' : 'seats'}?
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Your contact information will be shared with the passenger once you accept.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleAcceptRequest}
            disabled={actionLoading}
          >
            {actionLoading ? 'Processing...' : 'Accept Request'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reject Request Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleCloseDialogs}>
        <DialogTitle>Reject Join Request</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to reject {selectedRequest?.user?.name}'s request?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleRejectRequest}
            disabled={actionLoading}
          >
            {actionLoading ? 'Processing...' : 'Reject Request'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Cancel Request Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseDialogs}>
        <DialogTitle>Cancel Request</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to cancel your request for this ride?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>No, Keep Request</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleCancelRequest}
            disabled={actionLoading}
          >
            {actionLoading ? 'Canceling...' : 'Yes, Cancel Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyRides; 