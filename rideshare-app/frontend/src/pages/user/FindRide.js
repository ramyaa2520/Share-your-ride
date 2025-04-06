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

import { useRideStore } from '../../store/rideStore';
import PlaceAutocomplete from '../../components/map/PlaceAutocomplete';
import MapComponent from '../../components/map/MapComponent';
import { useAuthStore } from '../../store/authStore';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

const FindRide = () => {
  const { 
    availableRides, 
    pagination,
    getAvailableRides, 
    loading, 
    error 
  } = useRideStore();
  
  const { user } = useAuthStore();
  
  const [searchParams, setSearchParams] = useState({
    pickup: null,
    destination: null,
    minFare: '',
    maxFare: '',
    sortBy: 'requestedAt'
  });
  
  const [filterOpen, setFilterOpen] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [rideDetailsOpen, setRideDetailsOpen] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 }); // Default to center of India
  
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
      
      // Add other params if they exist
      if (searchParams.pickup?.location) {
        queryParams.pickup = `${searchParams.pickup.location.coordinates[0]},${searchParams.pickup.location.coordinates[1]}`;
      }
      
      if (searchParams.destination?.location) {
        queryParams.destination = `${searchParams.destination.location.coordinates[0]},${searchParams.destination.location.coordinates[1]}`;
      }
      
      if (searchParams.minFare) {
        queryParams.minFare = searchParams.minFare;
      }
      
      if (searchParams.maxFare) {
        queryParams.maxFare = searchParams.maxFare;
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
      sortBy: 'requestedAt'
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
        label = 'Looking for driver';
        break;
      case 'driver_assigned':
        color = 'primary';
        label = 'Driver assigned';
        break;
      case 'driver_arrived':
        color = 'secondary';
        label = 'Driver arrived';
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
            <Grid item xs={6} md={3}>
              <TextField
                label="Min Fare (₹)"
                fullWidth
                value={searchParams.minFare}
                onChange={handleMinFareChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                label="Max Fare (₹)"
                fullWidth
                value={searchParams.maxFare}
                onChange={handleMaxFareChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
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
                {availableRides.map(ride => (
                  <Grid item xs={12} sm={6} md={4} key={ride._id}>
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
                            <AttachMoneyIcon fontSize="small" />
                            <Typography variant="body1" fontWeight="bold">
                              ₹{ride.fare?.estimatedFare?.toFixed(2)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <DirectionsCarIcon fontSize="small" />
                            <Typography variant="body2">
                              {ride.rideType?.charAt(0).toUpperCase() + ride.rideType?.slice(1) || 'Economy'}
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
                      </CardContent>
                      
                      <CardActions sx={{ px: 2, pb: 2 }}>
                        <Button 
                          fullWidth 
                          variant="contained"
                          onClick={() => handleViewRideDetails(ride)}
                        >
                          View Details
                        </Button>
                      </CardActions>
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
        {selectedRide && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Ride Details</Typography>
                <IconButton onClick={handleCloseRideDetails}>
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
                          Requested
                        </Typography>
                        <Typography variant="body1">
                          {formatTimeSince(selectedRide.requestedAt)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                  
                  {selectedRide.user && (
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
              <Button onClick={handleCloseRideDetails} variant="outlined">
                Close
              </Button>
              {user?.role === 'driver' && (
                <Button 
                  variant="contained" 
                  color="primary"
                  // Add accept ride functionality for drivers here
                >
                  Accept Ride
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default FindRide; 