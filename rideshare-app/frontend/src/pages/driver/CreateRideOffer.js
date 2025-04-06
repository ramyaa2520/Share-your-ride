import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  InputAdornment
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

// Icons
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';
import AirlineSeatReclineNormalIcon from '@mui/icons-material/AirlineSeatReclineNormal';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ColorLensIcon from '@mui/icons-material/ColorLens';

import { useRideStore } from '../../store/rideStore';
import { useAuthStore } from '../../store/authStore';
import PlaceAutocomplete from '../../components/map/PlaceAutocomplete';

const vehicleYears = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

const vehicleColors = [
  'Black', 'White', 'Silver', 'Gray', 'Blue', 'Red', 
  'Green', 'Yellow', 'Brown', 'Orange', 'Purple', 'Gold'
];

const CreateRideOffer = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createRideOffer, loading, error, clearError } = useRideStore();
  
  const [formData, setFormData] = useState({
    departureAddress: '',
    departureCity: '',
    destinationAddress: '',
    destinationCity: '',
    departureTime: dayjs().add(1, 'day').hour(8).minute(0),
    availableSeats: 3,
    price: 20,
    vehicle: {
      model: user?.driverInfo?.vehicle?.model || '',
      color: user?.driverInfo?.vehicle?.color || '',
      licensePlate: user?.driverInfo?.vehicle?.licensePlate || '',
    },
    departureLocation: { lat: null, lng: null },
    destinationLocation: { lat: null, lng: null }
  });
  
  const [formErrors, setFormErrors] = useState({});
  
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
    
    // Clear error for this field if it exists
    if (formErrors.departureTime) {
      setFormErrors(prev => ({
        ...prev,
        departureTime: null
      }));
    }
  };
  
  const handlePlaceChange = (place, type) => {
    if (!place) return;
    
    const addressComponents = place.addressComponents || {};
    const location = place.location || { lat: null, lng: null };
    const address = place.description || '';
    const city = addressComponents.city || 
                addressComponents.town || 
                address.split(',')[1]?.trim() || 
                '';
                
    if (type === 'departure') {
      setFormData({
        ...formData,
        departureAddress: address,
        departureCity: city,
        departureLocation: location,
      });
    } else {
      setFormData({
        ...formData,
        destinationAddress: address,
        destinationCity: city,
        destinationLocation: location,
      });
    }
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
    
    if (!formData.price) {
      errors.price = 'Price is required';
    } else if (isNaN(formData.price) || formData.price <= 0) {
      errors.price = 'Price must be a positive number';
    }
    
    if (!formData.vehicle.model) errors.vehicleModel = 'Vehicle model is required';
    if (!formData.vehicle.color) errors.vehicleColor = 'Vehicle color is required';
    if (!formData.vehicle.year) errors.vehicleYear = 'Vehicle year is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Set mock location data for development
    const offerData = {
      ...formData,
      departureLocation: formData.departureLocation.lat 
        ? formData.departureLocation 
        : { lat: 40.7128, lng: -74.0060 }, // New York coordinates as default
      destinationLocation: formData.destinationLocation.lat 
        ? formData.destinationLocation 
        : { lat: 42.3601, lng: -71.0589 }, // Boston coordinates as default
      departureTime: formData.departureTime.toISOString(),
    };
    
    const result = await createRideOffer(offerData);
    
    if (result) {
      navigate('/driver/my-offers');
    }
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Create Ride Offer
        </Typography>
        
        <Divider sx={{ mb: 4 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Route Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <PlaceAutocomplete
                label="Departure Address"
                placeholder="Enter departure location"
                onChange={(place) => handlePlaceChange(place, 'departure')}
                value={{ description: formData.departureAddress }}
                required
                error={!!formErrors.departureAddress}
                helperText={formErrors.departureAddress}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Departure City"
                name="departureCity"
                value={formData.departureCity}
                onChange={handleChange}
                fullWidth
                required
                error={!!formErrors.departureCity}
                helperText={formErrors.departureCity}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <PlaceAutocomplete
                label="Destination Address"
                placeholder="Enter destination location"
                onChange={(place) => handlePlaceChange(place, 'destination')}
                value={{ description: formData.destinationAddress }}
                required
                error={!!formErrors.destinationAddress}
                helperText={formErrors.destinationAddress}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Destination City"
                name="destinationCity"
                value={formData.destinationCity}
                onChange={handleChange}
                fullWidth
                required
                error={!!formErrors.destinationCity}
                helperText={formErrors.destinationCity}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Ride Details
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
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
            
            <Grid item xs={12} md={6}>
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
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Price per Seat"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ min: 1, step: "0.01" }}
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
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Vehicle Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Vehicle Model"
                name="vehicle.model"
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
            
            <Grid item xs={12} md={3}>
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
            
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Vehicle Year"
                name="vehicle.year"
                value={formData.vehicle.year}
                onChange={handleChange}
                fullWidth
                required
                error={!!formErrors.vehicleYear}
                helperText={formErrors.vehicleYear}
              >
                {vehicleYears.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} color="inherit" />}
                >
                  {loading ? 'Creating Offer...' : 'Create Ride Offer'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateRideOffer; 