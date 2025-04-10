import React, { useState, useEffect } from 'react';
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
  TextField,
  InputAdornment,
  Avatar,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Collapse,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Icons
import EventIcon from '@mui/icons-material/Event';
import AirlineSeatReclineNormalIcon from '@mui/icons-material/AirlineSeatReclineNormal';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import StarIcon from '@mui/icons-material/Star';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SortIcon from '@mui/icons-material/Sort';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import TripOriginIcon from '@mui/icons-material/TripOrigin';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import TextsmsIcon from '@mui/icons-material/Textsms';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import CallIcon from '@mui/icons-material/Call';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StraightenIcon from '@mui/icons-material/Straighten';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import { useRideStore } from '../../store/rideStore';
import PlaceAutocomplete from '../../components/map/PlaceAutocomplete';
import MapComponent from '../../components/map/MapComponent';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

const FindRide = () => {
  const { 
    availableRides, 
    pagination,
    getAvailableRides, 
    loading, 
    error,
    setLoading
  } = useRideStore();
  
  const { user } = useAuthStore();
  
  const [searchParams, setSearchParams] = useState({
    pickup: null,
    destination: null,
    minFare: '',
    maxFare: '',
    sortBy: 'requestedAt',
    date: null,
    seats: ''
  });
  
  const [filterOpen, setFilterOpen] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [rideDetailsOpen, setRideDetailsOpen] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 }); // Default to center of India
  const [requestingRideId, setRequestingRideId] = useState(null);
  
  // Fetch rides on component mount
  useEffect(() => {
    fetchRides();
  }, []);
  
  // Fetch rides when page changes
  const fetchRides = async (page = 1) => {
    try {
      // Build query params object
      const queryParams = {
        page,
        limit: 6,
        sortBy: searchParams.sortBy
      };
      
      // Add pickup location if it exists with proper validation
      if (searchParams.pickup?.location?.coordinates?.length === 2) {
        queryParams.pickup = `${searchParams.pickup.location.coordinates[0]},${searchParams.pickup.location.coordinates[1]}`;
      } else if (searchParams.pickup?.lat && searchParams.pickup?.lng) {
        // Fallback to lat/lng format if available
        queryParams.pickup = `${searchParams.pickup.lng},${searchParams.pickup.lat}`;
      }
      
      // Add destination location if it exists with proper validation
      if (searchParams.destination?.location?.coordinates?.length === 2) {
        queryParams.destination = `${searchParams.destination.location.coordinates[0]},${searchParams.destination.location.coordinates[1]}`;
      } else if (searchParams.destination?.lat && searchParams.destination?.lng) {
        // Fallback to lat/lng format if available
        queryParams.destination = `${searchParams.destination.lng},${searchParams.destination.lat}`;
      }
      
      // We'll keep these in the logic but remove from UI per user request
      if (searchParams.minFare) {
        queryParams.minFare = searchParams.minFare;
      }
      
      if (searchParams.maxFare) {
        queryParams.maxFare = searchParams.maxFare;
      }
      
      if (searchParams.date) {
        queryParams.date = searchParams.date.format('YYYY-MM-DD');
      }
      
      if (searchParams.seats) {
        queryParams.seats = searchParams.seats;
      }
      
      console.log('Fetching rides with params:', queryParams);
      await getAvailableRides(queryParams);
    } catch (err) {
      console.error('Error fetching available rides:', err);
    }
  };
  
  const handlePickupChange = (place) => {
    if (!place) return;
    setSearchParams(prev => ({
      ...prev,
      pickup: place
    }));
  };
  
  const handleDestinationChange = (place) => {
    if (!place) return;
    setSearchParams(prev => ({
      ...prev,
      destination: place
    }));
  };
  
  const handleMinFareChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setSearchParams(prev => ({
        ...prev,
        minFare: value
      }));
    }
  };
  
  const handleMaxFareChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setSearchParams(prev => ({
        ...prev,
        maxFare: value
      }));
    }
  };
  
  const handleDateChange = (newDate) => {
    setSearchParams(prev => ({
      ...prev,
      date: newDate
    }));
  };
  
  const handleSeatsChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^[1-9]\d*$/.test(value)) {
      setSearchParams(prev => ({
        ...prev,
        seats: value
      }));
    }
  };
  
  const handleSortChange = (e) => {
    setSearchParams(prev => ({
      ...prev,
      sortBy: e.target.value
    }));
  };
  
  const handleFilterToggle = () => {
    setFilterOpen(!filterOpen);
  };
  
  const handleSearch = () => {
    fetchRides(1); // Reset to first page when searching
  };
  
  const handleClearFilters = () => {
    setSearchParams({
      pickup: null,
      destination: null,
      minFare: '',
      maxFare: '',
      sortBy: 'requestedAt',
      date: null,
      seats: ''
    });
    
    // Fetch rides with cleared filters
    fetchRides(1);
  };
  
  const handlePageChange = (event, value) => {
    fetchRides(value);
  };
  
  const handleViewRideDetails = (ride) => {
    setSelectedRide(ride);
    setRideDetailsOpen(true);
    
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
  
  const handleCloseRideDetails = () => {
    setRideDetailsOpen(false);
    setSelectedRide(null);
    setRoutePolyline(null);
    setMarkers([]);
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
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return dayjs(dateStr).format('MMM D, YYYY');
  };
  
  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
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
      default:
        color = 'default';
        label = status;
    }
    
    return <Chip size="small" color={color} label={label} />;
  };
  
  // Render empty state when no rides are available
  const renderEmptyState = () => (
    <Box sx={{ textAlign: 'center', p: 4 }}>
      <DriveEtaIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h5" color="text.secondary" gutterBottom>
        No rides available
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Try adjusting your search filters or check back later.
      </Typography>
      <Button variant="outlined" onClick={handleClearFilters}>
        Clear filters
      </Button>
    </Box>
  );
  
  const handleRequestRide = async (rideId) => {
    try {
      setRequestingRideId(rideId);
      setLoading(true);
      
      // Get the number of seats requested
      const ride = availableRides.find(r => r._id === rideId);
      const seatsToRequest = Number(searchParams.seats || 1);
      
      if (!ride) {
        toast.error('Ride not found. Please refresh and try again.');
        setRequestingRideId(null);
        setLoading(false);
        return;
      }
      
      // Validate seats
      if (seatsToRequest < 1 || seatsToRequest > (ride.seats || 1)) {
        toast.error(`Please request between 1 and ${ride.seats || 1} seats.`);
        setRequestingRideId(null);
        setLoading(false);
        return;
      }
      
      console.log(`Requesting ride with ID: ${rideId}, Seats: ${seatsToRequest}`);
      
      // Make the API call
      await getAvailableRides({
        ...searchParams,
        seats: seatsToRequest
      });
      
      // Show success message
      toast.success('Ride request sent successfully!');
      
      // Refresh the rides list
      fetchRides();
    } catch (error) {
      console.error('Error requesting ride:', error);
      toast.error('Failed to request ride: ' + (error.response?.data?.message || error.message));
    } finally {
      setRequestingRideId(null);
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Find a Ride
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Search Rides</Typography>
          <Button 
            startIcon={<FilterListIcon />}
            onClick={handleFilterToggle}
            variant="text"
          >
            {filterOpen ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>
        
        <Collapse in={filterOpen}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <PlaceAutocomplete
                label="Pickup Location"
                fullWidth
                value={searchParams.pickup ? searchParams.pickup.address : ''}
                onChange={handlePickupChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TripOriginIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <PlaceAutocomplete
                label="Destination"
                fullWidth
                value={searchParams.destination ? searchParams.destination.address : ''}
                onChange={handleDestinationChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FmdGoodIcon color="error" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={6} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Travel Date"
                  value={searchParams.date}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EventIcon />
                      </InputAdornment>
                    ),
                  }}
                  slotProps={{
                    textField: { 
                      fullWidth: true,
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EventIcon />
                          </InputAdornment>
                        ),
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={6} md={4}>
              <TextField
                label="Number of Seats"
                fullWidth
                value={searchParams.seats}
                onChange={handleSeatsChange}
                placeholder="e.g. 2"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AirlineSeatReclineNormalIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="sort-by-label">Sort By</InputLabel>
                <Select
                  labelId="sort-by-label"
                  value={searchParams.sortBy}
                  onChange={handleSortChange}
                  label="Sort By"
                  startAdornment={
                    <InputAdornment position="start">
                      <SortIcon fontSize="small" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="requestedAt">Most Recent</MenuItem>
                  <MenuItem value="fare_low">Price: Low to High</MenuItem>
                  <MenuItem value="fare_high">Price: High to Low</MenuItem>
                  <MenuItem value="distance_low">Distance: Shortest First</MenuItem>
                  <MenuItem value="distance_high">Distance: Longest First</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button 
              variant="outlined" 
              onClick={handleClearFilters}
              disabled={loading}
            >
              Clear
            </Button>
            <Button 
              variant="contained" 
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
          </Box>
        </Collapse>
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
      ) : (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Available Rides{' '}
              {pagination?.totalResults > 0 && (
                <Typography component="span" variant="body2" color="text.secondary">
                  ({pagination.totalResults} found)
                </Typography>
              )}
            </Typography>
          </Box>
          
          {(!availableRides || availableRides.length === 0) ? (
            renderEmptyState()
          ) : (
            <>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {availableRides.map((ride) => (
                  <Grid item xs={12} key={ride._id}>
                    <Card 
                      elevation={3}
                      sx={{ 
                        mb: 2,
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6
                        }
                      }}
                    >
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={8}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <PersonIcon sx={{ color: 'primary.main', mr: 1 }} />
                                <Typography variant="subtitle1">
                                  {ride.user && `${ride.user.name || 'Anonymous User'}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                  {formatTimeSince(ride.requestedAt)}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TripOriginIcon sx={{ color: 'primary.main', mr: 1 }} fontSize="small" />
                                <Typography variant="body1" noWrap>
                                  {ride.pickup?.address || 'Pickup location'}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <FmdGoodIcon sx={{ color: 'error.main', mr: 1 }} fontSize="small" />
                                <Typography variant="body1" noWrap>
                                  {ride.destination?.address || 'Destination location'}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <AirlineSeatReclineNormalIcon sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />
                                <Typography variant="body2" color="text.secondary">
                                  {ride.seats || 1} {ride.seats === 1 ? 'seat' : 'seats'} available
                                </Typography>
                                
                                <Box sx={{ mx: 2 }}>•</Box>
                                
                                <EventIcon sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(ride.requestedAt || ride.createdAt)}
                                </Typography>
                                
                                <Box sx={{ mx: 2 }}>•</Box>
                                
                                <PhoneIcon sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />
                                <Typography variant="body2" color="text.secondary">
                                  {ride.user?.phoneNumber || 'No phone provided'}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
                                {getRideStatusChip(ride.status)}
                                
                                {ride.estimatedDistance && (
                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                    <DirectionsCarIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                    {ride.estimatedDistance.toFixed(1)} km
                                  </Typography>
                                )}
                                
                                {ride.estimatedDuration && (
                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                    <AccessTimeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                    {(ride.estimatedDuration / 60).toFixed(0)} min
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                height: '100%',
                                alignItems: { xs: 'flex-start', md: 'flex-end' },
                                justifyContent: 'space-between'
                              }}
                            >
                              <Box 
                                sx={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: { xs: 'flex-start', md: 'flex-end' }
                                }}
                              >
                                <Typography variant="h5" sx={{ mb: 1, color: 'primary.main' }}>
                                  <CurrencyRupeeIcon fontSize="small" />
                                  {ride.fare?.estimatedFare || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Fare estimate
                                </Typography>
                              </Box>
                              
                              <Box 
                                sx={{ 
                                  display: 'flex', 
                                  mt: 2,
                                  flexDirection: { xs: 'row', md: 'column' },
                                  width: { xs: '100%', md: 'auto' },
                                  gap: 1
                                }}
                              >
                                <Button
                                  variant="contained"
                                  fullWidth
                                  startIcon={<TextsmsIcon />}
                                  onClick={() => handleViewRideDetails(ride)}
                                >
                                  Details
                                </Button>
                                
                                <Button
                                  variant="outlined"
                                  fullWidth
                                  color="secondary"
                                  disabled={requestingRideId === ride._id}
                                  startIcon={requestingRideId === ride._id ? <CircularProgress size={20} /> : <ThumbUpAltIcon />}
                                  onClick={() => handleRequestRide(ride._id)}
                                >
                                  Request Ride
                                </Button>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {pagination && pagination.totalPages > 1 && (
                <Box display="flex" justifyContent="center" my={3}>
                  <Pagination 
                    count={pagination.totalPages} 
                    page={pagination.currentPage}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}
      
      {/* Ride Details Dialog */}
      <Dialog
        open={rideDetailsOpen}
        onClose={handleCloseRideDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Ride Details
          <IconButton
            aria-label="close"
            onClick={handleCloseRideDetails}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        {selectedRide && (
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Route Information</Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  {getRideStatusChip(selectedRide.status)}
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Pickup Location</Typography>
                  <Typography variant="body1">{selectedRide.pickup?.address}</Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Destination</Typography>
                  <Typography variant="body1">{selectedRide.destination?.address}</Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Estimated Distance</Typography>
                  <Typography variant="body1">{selectedRide.estimatedDistance?.toFixed(1)} km</Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Estimated Duration</Typography>
                  <Typography variant="body1">{(selectedRide.estimatedDuration / 60)?.toFixed(0)} minutes</Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Available Seats</Typography>
                  <Typography variant="body1">{selectedRide.seats || 1}</Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Fare Estimate</Typography>
                  <Typography variant="h6" color="primary.main">
                    <CurrencyRupeeIcon fontSize="small" /> {selectedRide.fare?.estimatedFare || 0}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>User Information</Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">User</Typography>
                  <Typography variant="body1">{selectedRide.user?.name || 'Anonymous'}</Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Contact Phone</Typography>
                  <Typography variant="body1">
                    {selectedRide.user?.phoneNumber || 'No phone number provided'}
                    {selectedRide.user?.phoneNumber && (
                      <IconButton 
                        color="primary" 
                        size="small" 
                        component="a" 
                        href={`tel:${selectedRide.user.phoneNumber}`}
                        sx={{ ml: 1 }}
                      >
                        <CallIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Typography>
                </Box>
                
                {selectedRide.vehicle && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>Vehicle Information</Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Vehicle Type</Typography>
                      <Typography variant="body1">{selectedRide.vehicle.vehicleType}</Typography>
                    </Box>
                    
                    {selectedRide.vehicle.make && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Make & Model</Typography>
                        <Typography variant="body1">{selectedRide.vehicle.make} {selectedRide.vehicle.model}</Typography>
                      </Box>
                    )}
                    
                    {selectedRide.vehicle.licensePlate && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">License Plate</Typography>
                        <Typography variant="body1">{selectedRide.vehicle.licensePlate}</Typography>
                      </Box>
                    )}
                  </>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<ThumbUpAltIcon />}
                  onClick={() => handleRequestRide(selectedRide._id)}
                  disabled={requestingRideId === selectedRide._id}
                >
                  {requestingRideId === selectedRide._id ? (
                    <>
                      <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                      Requesting...
                    </>
                  ) : (
                    'Request This Ride'
                  )}
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
        )}
      </Dialog>
    </Box>
  );
};

export default FindRide; 