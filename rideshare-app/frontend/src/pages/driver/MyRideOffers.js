import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  CircularProgress,
  Stack,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';

// Icons
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';
import AirlineSeatReclineNormalIcon from '@mui/icons-material/AirlineSeatReclineNormal';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

import { useRideStore } from '../../store/rideStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { toast } from 'react-toastify';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

const MyRideOffers = () => {
  const navigate = useNavigate();
  const { rideOffers, getDriverOffers, loading, error } = useRideStore();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      await getDriverOffers();
    };
    
    fetchData();
  }, [getDriverOffers]);
  
  const handleCreateOffer = () => {
    navigate('/driver/create-offer');
  };
  
  const handleViewPassengers = (offerId) => {
    // In real app, navigate to passengers list
    toast.info('View passengers feature will be implemented in the next update');
  };
  
  const handleEditOffer = (offerId) => {
    // In real app, navigate to edit form
    toast.info('Edit offer feature will be implemented in the next update');
  };
  
  const handleDeleteConfirm = (offerId) => {
    setDeleteConfirm(offerId);
  };
  
  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };
  
  const handleDelete = (offerId) => {
    // In real app, call API to delete offer
    toast.success('Offer deleted successfully');
    setDeleteConfirm(null);
    
    // Simulate removal from list
    const updatedOffers = rideOffers.filter(offer => offer.id !== offerId);
    localStorage.setItem('rideOffers', JSON.stringify(updatedOffers));
    
    // Refresh the list
    getDriverOffers();
  };
  
  const renderOfferStatus = (departureTime) => {
    const now = dayjs();
    const departure = dayjs(departureTime);
    
    if (departure.isBefore(now)) {
      return <Chip label="Completed" color="default" size="small" />;
    } else if (departure.diff(now, 'hour') < 24) {
      return <Chip label="Departing Soon" color="warning" size="small" />;
    } else {
      return <Chip label="Active" color="success" size="small" />;
    }
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">My Ride Offers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateOffer}
        >
          Create New Offer
        </Button>
      </Stack>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : rideOffers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            You don't have any ride offers yet
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Create your first ride offer to start earning!
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateOffer}
          >
            Create Ride Offer
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {rideOffers.map((offer) => (
            <Grid item xs={12} key={offer.id}>
              <Card
                elevation={3}
                sx={{
                  position: 'relative',
                  '&:hover': { boxShadow: 6 }
                }}
              >
                {deleteConfirm === offer.id && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 5,
                      p: 2
                    }}
                  >
                    <Typography variant="h6" color="white" align="center" gutterBottom>
                      Are you sure you want to delete this offer?
                    </Typography>
                    <Typography variant="body2" color="white" align="center" sx={{ mb: 3 }}>
                      This action cannot be undone.
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleCancelDelete}
                        sx={{ color: 'white', borderColor: 'white' }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleDelete(offer.id)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Box>
                )}
                
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <Typography variant="h6">
                          {offer.departure.city} to {offer.destination.city}
                        </Typography>
                        {renderOfferStatus(offer.departureTime)}
                      </Stack>
                      
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <LocationOnIcon color="primary" fontSize="small" />
                        <Typography variant="body1">
                          From: {offer.departure.address}
                        </Typography>
                      </Stack>
                      
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <LocationOnIcon color="secondary" fontSize="small" />
                        <Typography variant="body1">
                          To: {offer.destination.address}
                        </Typography>
                      </Stack>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <EventIcon fontSize="small" />
                            <Typography variant="body2">
                              Departure: {dayjs(offer.departureTime).format('MMM D, YYYY h:mm A')}
                            </Typography>
                          </Stack>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <DirectionsCarIcon fontSize="small" />
                            <Typography variant="body2">
                              Vehicle: {offer.driver.vehicle.model} ({offer.driver.vehicle.color})
                            </Typography>
                          </Stack>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <AirlineSeatReclineNormalIcon fontSize="small" />
                            <Typography variant="body2">
                              Available Seats: {offer.availableSeats}
                            </Typography>
                          </Stack>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <AttachMoneyIcon fontSize="small" />
                            <Typography variant="body2">
                              Price per Seat: ${offer.price}
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'flex-end' }
                        }}
                      >
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Created {dayjs(offer.createdAt).fromNow()}
                          </Typography>
                        </Box>
                        
                        <Stack 
                          direction={{ xs: 'row', sm: 'column' }} 
                          spacing={1}
                          sx={{ mt: { xs: 2, sm: 0 } }}
                        >
                          <Tooltip title="View Passengers">
                            <IconButton 
                              color="primary" 
                              onClick={() => handleViewPassengers(offer.id)}
                              size="small"
                            >
                              <FormatListBulletedIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Edit Offer">
                            <IconButton 
                              color="secondary" 
                              onClick={() => handleEditOffer(offer.id)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Delete Offer">
                            <IconButton 
                              color="error" 
                              onClick={() => handleDeleteConfirm(offer.id)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MyRideOffers; 