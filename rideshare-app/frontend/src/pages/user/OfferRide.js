import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

// Icons
import EventIcon from '@mui/icons-material/Event';
import AirlineSeatReclineNormalIcon from '@mui/icons-material/AirlineSeatReclineNormal';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useRideStore } from '../../store/rideStore';
import { useAuthStore } from '../../store/authStore';
import PlaceAutocomplete from '../../components/map/PlaceAutocomplete';
import MapComponent from '../../components/map/MapComponent';

const vehicleColors = [
  'Black', 'White', 'Silver', 'Gray', 'Blue', 'Red', 
  'Green', 'Yellow', 'Brown', 'Orange', 'Purple', 'Gold'
];

const OfferRide = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createRideOffer, loading, error } = useRideStore();
  
  const [formData, setFormData] = useState({
    departureAddress: '',
    departureCity: '',
    destinationAddress: '',
    destinationCity: '',
    departureTime: dayjs().add(1, 'day').hour(8).minute(0),
    availableSeats: 3,
    price: 20,
    vehicle: {
      model: '',
      color: 'Black',
      licensePlate: '',
    },
    phoneNumber: user?.phoneNumber || '',
    notes: '',
    departureLocation: { lat: null, lng: null },
    destinationLocation: { lat: null, lng: null }
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [markers, setMarkers] = useState([]);
  const [routePolyline, setRoutePolyline] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('vehicle.')) {
      const vehicleField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          [vehicleField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const handleDateChange = (newValue) => {
    setFormData(prev => ({
      ...prev,
      departureTime: newValue
    }));
    
    if (formErrors.departureTime) {
      setFormErrors(prev => ({
        ...prev,
        departureTime: null
      }));
    }
  };

  const handlePlaceChange = async (place, type) => {
    if (!place) return;
    
    console.log('Place selected:', place); // For debugging purposes
    
    const location = place.location || { lat: null, lng: null };
    const address = place.description || '';
    
    // Extract city from address components or use fallback
    let city = '';
    if (place.addressComponents?.city) {
      city = place.addressComponents.city;
    } else if (place.addressComponents?.town) {
      city = place.addressComponents.town;
    } else {
      // Try to extract city from the full address
      const addressParts = address.split(',');
      if (addressParts.length > 1) {
        city = addressParts[1].trim();
      }
    }
    
    // Create a more readable format for the address
    const formattedAddress = place.formattedAddress || address;
                
    if (type === 'departure') {
      setFormData(prev => ({
        ...prev,
        departureAddress: formattedAddress,
        departureCity: city,
        departureLocation: location,
      }));
      
      // Clear error if it exists
      if (formErrors.departureAddress) {
        setFormErrors(prev => ({
          ...prev,
          departureAddress: null
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        destinationAddress: formattedAddress,
        destinationCity: city,
        destinationLocation: location,
      }));
      
      // Clear error if it exists
      if (formErrors.destinationAddress) {
        setFormErrors(prev => ({
          ...prev,
          destinationAddress: null
        }));
      }
    }
    
    updateMapMarkers(
      type === 'departure' ? location : formData.departureLocation,
      type === 'destination' ? location : formData.destinationLocation
    );
  };
  
  const updateMapMarkers = (departure, destination) => {
    const newMarkers = [];
    
    if (departure && departure.lat) {
      newMarkers.push({
        id: 'departure',
        position: { lat: departure.lat, lng: departure.lng },
        title: 'Departure Location',
        info: formData.departureAddress
      });
    }
    
    if (destination && destination.lat) {
      newMarkers.push({
        id: 'destination',
        position: { lat: destination.lat, lng: destination.lng },
        title: 'Destination',
        info: formData.destinationAddress
      });
    }
    
    setMarkers(newMarkers);
    
    if (departure && departure.lat && destination && destination.lat) {
      calculateRoute(departure, destination);
    }
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
  
  const getMapCenter = () => {
    if (formData.departureLocation && formData.departureLocation.lat) {
      return formData.departureLocation;
    }
    
    if (formData.destinationLocation && formData.destinationLocation.lat) {
      return formData.destinationLocation;
    }
    
    return { lat: 40.7128, lng: -74.0060 }; // Default to New York City
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.departureAddress) errors.departureAddress = 'Departure address is required';
    if (!formData.departureCity) errors.departureCity = 'Departure city is required';
    if (!formData.destinationAddress) errors.destinationAddress = 'Destination address is required';
    if (!formData.destinationCity) errors.destinationCity = 'Destination city is required';
    
    if (!formData.departureTime) {
      errors.departureTime = 'Departure time is required';
    } else if (dayjs(formData.departureTime).isBefore(dayjs())) {
      errors.departureTime = 'Departure time must be in the future';
    }
    
    if (!formData.availableSeats) {
      errors.availableSeats = 'Available seats is required';
    } else if (formData.availableSeats < 1 || formData.availableSeats > 8) {
      errors.availableSeats = 'Available seats must be between 1 and 8';
    }
    
    if (!formData.price && formData.price !== 0) {
      errors.price = 'Price is required';
    } else if (isNaN(formData.price) || formData.price < 0) {
      errors.price = 'Price must be a positive number';
    }
    
    if (!formData.vehicle.model) errors.vehicleModel = 'Vehicle model is required';
    if (!formData.vehicle.color) errors.vehicleColor = 'Vehicle color is required';
    
    if (!formData.phoneNumber) {
      errors.phoneNumber = 'Phone number is required for contact';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Format the ride offer data for submission
    const offerData = {
      departureAddress: formData.departureAddress,
      departureCity: formData.departureCity,
      departureLocation: formData.departureLocation,
      destinationAddress: formData.destinationAddress,
      destinationCity: formData.destinationCity,
      destinationLocation: formData.destinationLocation,
      departureTime: formData.departureTime.toISOString(),
      availableSeats: parseInt(formData.availableSeats),
      price: parseFloat(formData.price),
      vehicle: {
        model: formData.vehicle.model,
        color: formData.vehicle.color,
        licensePlate: formData.vehicle.licensePlate
      },
      phoneNumber: formData.phoneNumber,
      notes: formData.notes
    };
    
    // Log the data being submitted to make debugging easier
    console.log('Submitting ride offer:', offerData);
    
    try {
      const newOffer = await createRideOffer(offerData);
      
      if (newOffer) {
        toast.success('Ride offer created successfully!');
        navigate('/my-rides');
      }
    } catch (error) {
      console.error('Error creating ride offer:', error);
      // Error is already handled by the store
    }
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center">
        Offer a Ride
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" align="center" color="text.secondary">
          Share your journey with others heading in the same direction
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <form onSubmit={handleSubmit}>
              <Typography variant="h6" gutterBottom>
                Route Details
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <PlaceAutocomplete
                    label="Departure Location"
                    placeholder="Where are you starting from?"
                    onChange={(place) => handlePlaceChange(place, 'departure')}
                    value={{ description: formData.departureAddress }}
                    required
                    error={!!formErrors.departureAddress}
                    helperText={formErrors.departureAddress}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <PlaceAutocomplete
                    label="Destination"
                    placeholder="Where are you going to?"
                    onChange={(place) => handlePlaceChange(place, 'destination')}
                    value={{ description: formData.destinationAddress }}
                    required
                    error={!!formErrors.destinationAddress}
                    helperText={formErrors.destinationAddress}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      label="Departure Time"
                      value={formData.departureTime}
                      onChange={handleDateChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          error: !!formErrors.departureTime,
                          helperText: formErrors.departureTime,
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
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Available Seats"
                    name="availableSeats"
                    type="number"
                    value={formData.availableSeats}
                    onChange={handleChange}
                    fullWidth
                    required
                    inputProps={{ min: 1, max: 8 }}
                    error={!!formErrors.availableSeats}
                    helperText={formErrors.availableSeats}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AirlineSeatReclineNormalIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Price per Seat"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    fullWidth
                    required
                    inputProps={{ min: 0, step: "0.01" }}
                    error={!!formErrors.price}
                    helperText={formErrors.price}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoneyIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Vehicle & Contact Details
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={7}>
                  <TextField
                    label="Vehicle Model"
                    name="vehicle.model"
                    placeholder="e.g. Toyota Camry, Honda Accord"
                    value={formData.vehicle.model}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!formErrors.vehicleModel}
                    helperText={formErrors.vehicleModel}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DirectionsCarIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={5}>
                  <TextField
                    select
                    label="Vehicle Color"
                    name="vehicle.color"
                    value={formData.vehicle.color}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!formErrors.vehicleColor}
                    helperText={formErrors.vehicleColor}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ColorLensIcon />
                        </InputAdornment>
                      ),
                    }}
                  >
                    {vehicleColors.map((color) => (
                      <MenuItem key={color} value={color}>
                        {color}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="License Plate"
                    name="vehicle.licensePlate"
                    placeholder="e.g. ABC123"
                    value={formData.vehicle.licensePlate}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Contact Phone"
                    name="phoneNumber"
                    placeholder="Your phone number for coordination"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!formErrors.phoneNumber}
                    helperText={formErrors.phoneNumber}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Additional Notes"
                    name="notes"
                    placeholder="Luggage space, pet friendly, etc."
                    value={formData.notes}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                          <InfoOutlinedIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  sx={{ mx: 1 }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ mx: 1 }}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} color="inherit" />}
                >
                  {loading ? 'Publishing...' : 'Publish Ride Offer'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Your Route
            </Typography>
            <Box sx={{ flex: 1, minHeight: '400px', mt: 2 }}>
              <MapComponent
                height="100%"
                markers={markers}
                polyline={routePolyline}
                center={getMapCenter()}
                zoom={markers.length === 0 ? 5 : 10}
              />
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Stack>
                  <Typography variant="body2" gutterBottom>
                    <strong>How it works:</strong>
                  </Typography>
                  <Typography variant="body2">
                    1. Publish your ride details
                  </Typography>
                  <Typography variant="body2">
                    2. Receive join requests from interested passengers
                  </Typography>
                  <Typography variant="body2">
                    3. Review and accept passengers that match your journey
                  </Typography>
                  <Typography variant="body2">
                    4. Coordinate pickup details with accepted passengers
                  </Typography>
                </Stack>
              </Alert>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OfferRide; 