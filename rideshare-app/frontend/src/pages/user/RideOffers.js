import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
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
  InputAdornment,
  Avatar,
  Rating,
  IconButton,
  Collapse,
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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';
import AirlineSeatReclineNormalIcon from '@mui/icons-material/AirlineSeatReclineNormal';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import StarIcon from '@mui/icons-material/Star';

import { useRideStore } from '../../store/rideStore';
import PlaceAutocomplete from '../../components/map/PlaceAutocomplete';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

const RideOffers = () => {
  const navigate = useNavigate();
  const { rideOffers, getRideOffers, joinRide, loading, error } = useRideStore();
  const [bookingId, setBookingId] = useState(null);
  const [filters, setFilters] = useState({
    departureCity: '',
    destinationCity: '',
    departurePlace: null,
    destinationPlace: null,
    departureDate: null
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      await getRideOffers();
    };
    
    fetchData();
  }, [getRideOffers]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDateChange = (newValue) => {
    setFilters(prev => ({
      ...prev,
      departureDate: newValue
    }));
  };
  
  const handleFilterToggle = () => {
    setFilterOpen(!filterOpen);
  };
  
  const handleSearch = async () => {
    const searchFilters = {
      ...filters,
      departureDate: filters.departureDate ? filters.departureDate.format('YYYY-MM-DD') : null
    };
    
    await getRideOffers(searchFilters);
  };
  
  const handleClearFilters = () => {
    setFilters({
      departureCity: '',
      destinationCity: '',
      departurePlace: null,
      destinationPlace: null,
      departureDate: null
    });
    
    getRideOffers();
  };
  
  const handleBook = async (offerId) => {
    setBookingId(offerId);
    setBookingLoading(true);
    
    try {
      const ride = await joinRide(offerId);
      if (ride) {
        navigate('/user/ride-details/' + ride.id);
      }
    } catch (error) {
      console.error('Error booking ride:', error);
    } finally {
      setBookingLoading(false);
      setBookingId(null);
    }
  };
  
  const handleDeparturePlaceChange = (place) => {
    if (!place) return;
    
    const city = place.addressComponents?.city || 
                place.addressComponents?.town || 
                place.description?.split(',')[1]?.trim() || 
                '';
                
    setFilters(prev => ({
      ...prev,
      departureCity: city,
      departurePlace: place
    }));
  };
  
  const handleDestinationPlaceChange = (place) => {
    if (!place) return;
    
    const city = place.addressComponents?.city || 
                place.addressComponents?.town || 
                place.description?.split(',')[1]?.trim() || 
                '';
                
    setFilters(prev => ({
      ...prev,
      destinationCity: city,
      destinationPlace: place
    }));
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Available Ride Offers</Typography>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={handleFilterToggle}
        >
          Filter
        </Button>
      </Stack>
      
      <Collapse in={filterOpen}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Search Rides
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <PlaceAutocomplete
                label="Departure City"
                placeholder="Enter departure city"
                onChange={handleDeparturePlaceChange}
                value={filters.departurePlace}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <PlaceAutocomplete
                label="Destination City"
                placeholder="Enter destination city"
                onChange={handleDestinationPlaceChange}
                value={filters.destinationPlace}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Departure Date"
                  value={filters.departureDate}
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
          </Grid>
          
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
            >
              Search
            </Button>
          </Stack>
        </Paper>
      </Collapse>
      
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
            No ride offers available
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Try changing your search criteria or check back later for new offers.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {rideOffers.map((offer) => (
            <Grid item xs={12} md={6} key={offer.id}>
              <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: 6 } }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Typography variant="h6">
                      {offer.departure.city} to {offer.destination.city}
                    </Typography>
                    <Chip 
                      label={`$${offer.price}`} 
                      color="primary" 
                      variant="outlined"
                      icon={<AttachMoneyIcon />}
                    />
                  </Stack>
                  
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <LocationOnIcon color="primary" fontSize="small" />
                    <Typography variant="body2" noWrap sx={{ maxWidth: '90%' }}>
                      From: {offer.departure.address}
                    </Typography>
                  </Stack>
                  
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <LocationOnIcon color="secondary" fontSize="small" />
                    <Typography variant="body2" noWrap sx={{ maxWidth: '90%' }}>
                      To: {offer.destination.address}
                    </Typography>
                  </Stack>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <EventIcon fontSize="small" />
                        <Typography variant="body2" noWrap>
                          {dayjs(offer.departureTime).format('MMM D, h:mm A')}
                        </Typography>
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AirlineSeatReclineNormalIcon fontSize="small" />
                        <Typography variant="body2">
                          {offer.availableSeats} seat{offer.availableSeats !== 1 ? 's' : ''} left
                        </Typography>
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <DirectionsCarIcon fontSize="small" />
                        <Typography variant="body2">
                          {offer.driver.vehicle.model} ({offer.driver.vehicle.color})
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {offer.driver.name ? offer.driver.name.charAt(0) : 'D'}
                    </Avatar>
                    <Typography variant="body2">{offer.driver.name}</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Rating
                        value={offer.driver.rating || 4.5}
                        readOnly
                        precision={0.5}
                        size="small"
                        emptyIcon={<StarIcon fontSize="inherit" />}
                      />
                      <Typography variant="caption">
                        ({offer.driver.rating || 4.5})
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
                  <Typography variant="caption" color="textSecondary">
                    Posted {dayjs(offer.createdAt).fromNow()}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={bookingLoading && bookingId === offer.id}
                    startIcon={bookingLoading && bookingId === offer.id ? <CircularProgress size={20} color="inherit" /> : null}
                    onClick={() => handleBook(offer.id)}
                  >
                    {bookingLoading && bookingId === offer.id ? 'Booking...' : 'Book Seat'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default RideOffers; 