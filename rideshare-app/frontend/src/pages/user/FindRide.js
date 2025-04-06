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
  Pagination
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

import { useRideStore } from '../../store/rideStore';
import PlaceAutocomplete from '../../components/map/PlaceAutocomplete';
import MapComponent from '../../components/map/MapComponent';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

const FindRide = () => {
  const { rideOffers, getRideOffers, requestToJoinRide, loading, error, createTestRides } = useRideStore();
  
  const [searchParams, setSearchParams] = useState({
    departurePlace: null,
    destinationPlace: null,
    departureDate: null
  });
  
  const [filterOpen, setFilterOpen] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestingRideId, setRequestingRideId] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [markers, setMarkers] = useState([]);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 }); // Default to Delhi, India
  
  // Add pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedRides, setPaginatedRides] = useState([]);
  
  const [filteredRides, setFilteredRides] = useState([]);
  const [dateFilter, setDateFilter] = useState(null);
  const [availableSeatsFilter, setAvailableSeatsFilter] = useState('');
  const [priceRangeFilter, setPriceRangeFilter] = useState([0, 1000]);
  const [queryParams, setQueryParams] = useState('');
  const [departure, setDeparture] = useState(null);
  const [destination, setDestination] = useState(null);
  const [departureQuery, setDepartureQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  
  useEffect(() => {
    const fetchRides = async () => {
      console.log('Fetching ride offers...');
      try {
        await getRideOffers();
      } catch (err) {
        console.error('Error fetching ride offers:', err);
      }
    };
    
    fetchRides();
  }, [getRideOffers]);
  
  // Handle pagination and display logic in a separate effect
  useEffect(() => {
    console.log('Ride offers received:', rideOffers?.length || 0);
    
    if (!rideOffers || rideOffers.length === 0) {
      setPaginatedRides([]);
      setTotalPages(1);
      return;
    }
    
    // Sort by departure time (soonest first)
    const sortedRides = [...rideOffers].sort((a, b) => {
      const dateA = new Date(a.departureTime || 0);
      const dateB = new Date(b.departureTime || 0);
      return dateA - dateB;
    });
    
    console.log("Sorted rides:", sortedRides.map(r => ({ 
      id: r.id, 
      departure: r.departure?.city,
      destination: r.destination?.city,
      departureTime: r.departureTime ? new Date(r.departureTime).toLocaleString() : 'unknown'
    })));
    
    // Calculate total pages
    const total = Math.ceil(sortedRides.length / itemsPerPage);
    setTotalPages(total || 1);
    
    // Get current page items
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageRides = sortedRides.slice(startIndex, endIndex);
    console.log(`Displaying rides ${startIndex+1}-${Math.min(endIndex, sortedRides.length)} of ${sortedRides.length}`);
    
    setPaginatedRides(currentPageRides);
  }, [rideOffers, page, itemsPerPage]);
  
  const handleDeparturePlaceChange = (place) => {
    if (!place) return;
    setSearchParams(prev => ({
      ...prev,
      departurePlace: place
    }));
  };
  
  const handleDestinationPlaceChange = (place) => {
    if (!place) return;
    setSearchParams(prev => ({
      ...prev,
      destinationPlace: place
    }));
  };
  
  const handleDateChange = (newValue) => {
    setSearchParams(prev => ({
      ...prev,
      departureDate: newValue
    }));
  };
  
  const handleFilterToggle = () => {
    setFilterOpen(!filterOpen);
  };
  
  const handleSearch = async () => {
    const filters = {};
    
    if (searchParams.departurePlace?.location) {
      filters.departureLat = searchParams.departurePlace.location.lat;
      filters.departureLng = searchParams.departurePlace.location.lng;
      filters.departureRadius = 30; // 30km radius
    }
    
    if (searchParams.destinationPlace?.location) {
      filters.destinationLat = searchParams.destinationPlace.location.lat;
      filters.destinationLng = searchParams.destinationPlace.location.lng;
      filters.destinationRadius = 30; // 30km radius
    }
    
    if (searchParams.departureDate) {
      filters.departureDate = searchParams.departureDate.format('YYYY-MM-DD');
    }
    
    await getRideOffers(filters);
  };
  
  const handleClearFilters = () => {
    setSearchParams({
      departurePlace: null,
      destinationPlace: null,
      departureDate: null
    });
    
    getRideOffers();
  };
  
  const handleViewRideDetails = (ride) => {
    setSelectedRide(ride);
    
    // Set markers and polyline for the map
    const newMarkers = [
      {
        id: 'departure',
        position: { 
          lat: ride.departure.location.lat, 
          lng: ride.departure.location.lng 
        },
        title: 'Departure',
        info: ride.departure.address
      },
      {
        id: 'destination',
        position: { 
          lat: ride.destination.location.lat, 
          lng: ride.destination.location.lng 
        },
        title: 'Destination',
        info: ride.destination.address
      }
    ];
    
    setMarkers(newMarkers);
    setMapCenter(ride.departure.location);
    
    // Calculate route for the selected ride
    calculateRoute(
      ride.departure.location,
      ride.destination.location
    );
  };
  
  const calculateRoute = async (departure, destination) => {
    try {
      const response = await fetch(
        `https://api.locationiq.com/v1/directions/driving/` +
        `${departure.lng},${departure.lat};${destination.lng},${destination.lat}` +
        `?key=pk.c61dfc5608103dcf469a185a22842c95&steps=false&overview=full&geometries=geojson`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Create polyline from route geometry
        if (route.geometry && route.geometry.coordinates) {
          const path = route.geometry.coordinates.map(coord => ({
            lng: coord[0],
            lat: coord[1]
          }));
          
          setRoutePolyline({
            path,
            options: {
              strokeColor: '#4285F4',
              strokeWeight: 4,
              strokeOpacity: 0.8
            }
          });
        }
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };
  
  const handleRequestToJoin = (ride) => {
    setSelectedRide(ride);
    setJoinDialogOpen(true);
  };
  
  const handleCloseJoinDialog = () => {
    setJoinDialogOpen(false);
    setRequestMessage('');
  };
  
  const handleSubmitJoinRequest = async () => {
    if (!selectedRide) return;
    
    setRequestLoading(true);
    setRequestingRideId(selectedRide.id);
    
    try {
      await requestToJoinRide(selectedRide.id, {
        message: requestMessage,
        seats: 1 // Default to 1 seat
      });
      
      setJoinDialogOpen(false);
      setRequestMessage('');
      
      // Show success or navigate to "My Rides" page
    } catch (error) {
      console.error('Error requesting to join ride:', error);
    } finally {
      setRequestLoading(false);
      setRequestingRideId(null);
    }
  };
  
  const formatDate = (dateStr) => {
    return dayjs(dateStr).format('ddd, MMM D, YYYY');
  };
  
  const formatTime = (dateStr) => {
    return dayjs(dateStr).format('h:mm A');
  };
  
  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
    // Scroll to top when changing pages
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  const handleCreateTestRides = async () => {
    try {
      await createTestRides();
      // After creating test rides, refresh the list
      await getRideOffers();
    } catch (err) {
      console.error('Error creating test rides:', err);
    }
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Find a Ride</Typography>
        
        <Button 
          variant="outlined" 
          color="secondary"
          onClick={handleCreateTestRides}
          disabled={loading}
        >
          Create Test Rides
        </Button>
      </Stack>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">Search for Rides</Typography>
          <IconButton onClick={handleFilterToggle} size="small">
            {filterOpen ? <CloseIcon /> : <FilterListIcon />}
          </IconButton>
        </Stack>
        
        <Collapse in={filterOpen}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <PlaceAutocomplete
                label="From"
                placeholder="Departure city or address"
                onChange={handleDeparturePlaceChange}
                value={searchParams.departurePlace}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <PlaceAutocomplete
                label="To"
                placeholder="Destination city or address"
                onChange={handleDestinationPlaceChange}
                value={searchParams.destinationPlace}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Departure Date"
                  value={searchParams.departureDate}
                  onChange={handleDateChange}
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
            
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  disabled={loading}
                >
                  Search Rides
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>
      
      {/* Display rides */}
      <Box sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : paginatedRides.length === 0 ? (
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No rides found
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Try adjusting your search criteria or check back later.
            </Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              {paginatedRides.map((ride) => (
                <Grid item xs={12} md={selectedRide ? 12 : 6} lg={selectedRide ? 12 : 4} key={ride.id}>
                  <Card 
                    elevation={selectedRide?.id === ride.id ? 4 : 2} 
                    sx={{ 
                      height: '100%',
                      display: 'flex', 
                      flexDirection: 'column',
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 6 },
                      border: selectedRide?.id === ride.id ? '2px solid #3f51b5' : 'none'
                    }}
                    onClick={() => handleViewRideDetails(ride)}
                  >
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                        <Box>
                          <Typography variant="h6">
                            {ride.departure.city} → {ride.destination.city}
                          </Typography>
                          <Typography variant="subtitle2" color="text.secondary">
                            {formatDate(ride.departureTime)} at {formatTime(ride.departureTime)}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`$${ride.price}`} 
                          color="primary" 
                          icon={<AttachMoneyIcon />}
                        />
                      </Stack>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={6}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <AirlineSeatReclineNormalIcon fontSize="small" />
                            <Typography variant="body2">
                              {ride.availableSeats} {ride.availableSeats === 1 ? 'seat' : 'seats'}
                            </Typography>
                          </Stack>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <DirectionsCarIcon fontSize="small" />
                            <Typography variant="body2" noWrap>
                              {ride.vehicle?.model || 'No vehicle info'}
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {ride.driver.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">{ride.driver.name}</Typography>
                        
                        {ride.driver.rating && (
                          <Rating
                            value={ride.driver.rating}
                            readOnly
                            precision={0.5}
                            size="small"
                            emptyIcon={<StarIcon fontSize="inherit" />}
                          />
                        )}
                      </Stack>
                    </CardContent>
                    
                    <CardActions sx={{ pt: 0, pb: 2, px: 2, alignSelf: 'flex-end' }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestToJoin(ride);
                        }}
                        disabled={requestLoading && requestingRideId === ride.id}
                        startIcon={requestLoading && requestingRideId === ride.id ? <CircularProgress size={20} /> : null}
                      >
                        Request to Join
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Pagination controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          </>
        )}
      </Box>
      
      {selectedRide && (
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Ride Details
            </Typography>
            
            <Box sx={{ height: 300, mb: 3 }}>
              <MapComponent
                height="100%"
                markers={markers}
                polyline={routePolyline}
                center={mapCenter}
                zoom={12}
              />
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  From
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedRide.departure.address}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  To
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedRide.destination.address}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(selectedRide.departureTime)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Time
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatTime(selectedRide.departureTime)}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Driver
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                  {selectedRide.driver.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body1">
                    {selectedRide.driver.name}
                  </Typography>
                  {selectedRide.driver.rating && (
                    <Rating
                      value={selectedRide.driver.rating}
                      readOnly
                      precision={0.5}
                      size="small"
                    />
                  )}
                </Box>
              </Stack>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Vehicle
              </Typography>
              <Typography variant="body1">
                {selectedRide.vehicle?.model || 'N/A'} 
                {selectedRide.vehicle?.color ? ` • ${selectedRide.vehicle.color}` : ''}
                {selectedRide.vehicle?.licensePlate ? ` • ${selectedRide.vehicle.licensePlate}` : ''}
              </Typography>
            </Box>
            
            {selectedRide.notes && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body1">
                  {selectedRide.notes}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 'auto' }}>
              <Button 
                variant="contained" 
                fullWidth
                startIcon={<PersonIcon />}
                onClick={() => handleRequestToJoin(selectedRide)}
              >
                Request to Join this Ride
              </Button>
            </Box>
          </Paper>
        </Grid>
      )}
      
      {/* Join Request Dialog */}
      <Dialog open={joinDialogOpen} onClose={handleCloseJoinDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Request to Join Ride</DialogTitle>
        <DialogContent>
          {selectedRide && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                {selectedRide.departure.city} to {selectedRide.destination.city}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatDate(selectedRide.departureTime)} at {formatTime(selectedRide.departureTime)}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" gutterBottom>
                Send a message to the driver with your request:
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Introduce yourself and explain why you want to join this ride..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                sx={{ mt: 2 }}
              />
              
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  Your contact information will be shared with the driver only after they accept your request.
                </Typography>
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseJoinDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitJoinRequest}
            disabled={requestLoading}
            startIcon={requestLoading ? <CircularProgress size={20} /> : null}
          >
            Send Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FindRide; 