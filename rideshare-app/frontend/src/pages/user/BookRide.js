import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  InputAdornment,
  IconButton,
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle';
import AirlineSeatReclineExtraIcon from '@mui/icons-material/AirlineSeatReclineExtra';
import StarIcon from '@mui/icons-material/Star';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AddressMenu from '../../components/address/AddressMenu';
import MapComponent from '../../components/map/MapComponent';
import { useRideStore } from '../../store/rideStore';
import { useUserStore } from '../../store/userStore';
import PlaceAutocomplete from '../../components/map/PlaceAutocomplete';

// Ride booking steps
const steps = ['Enter Locations', 'Select Ride Type', 'Confirm & Request'];

// Ride types with their details
const rideTypes = [
  {
    id: 'economy',
    name: 'Economy',
    icon: DirectionsCarIcon,
    description: 'Affordable rides for everyday trips',
    basePrice: 5,
    pricePerKm: 1.2,
    eta: '3-5'
  },
  {
    id: 'comfort',
    name: 'Comfort',
    icon: AirlineSeatReclineExtraIcon,
    description: 'More space, newer cars, top-rated drivers',
    basePrice: 8,
    pricePerKm: 1.5,
    eta: '4-6'
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: DirectionsCarIcon,
    description: 'High-end cars with professional drivers',
    basePrice: 12,
    pricePerKm: 2.2,
    eta: '5-8'
  },
  {
    id: 'suv',
    name: 'SUV',
    icon: AirportShuttleIcon,
    description: 'Spacious vehicles for groups up to 6 people',
    basePrice: 10,
    pricePerKm: 1.8,
    eta: '5-7'
  }
];

const BookRide = () => {
  const navigate = useNavigate();
  const { 
    requestRide, 
    getNearbyDrivers, 
    loading, 
    error, 
    clearError,
    nearbyDrivers
  } = useRideStore();
  const { savedAddresses, getSavedAddresses } = useUserStore();

  // Step state
  const [activeStep, setActiveStep] = useState(0);
  
  // Form state
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [selectedRideType, setSelectedRideType] = useState('economy');
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [searchingDrivers, setSearchingDrivers] = useState(false);
  const [showSavedPickupAddresses, setShowSavedPickupAddresses] = useState(false);
  const [showSavedDestinationAddresses, setShowSavedDestinationAddresses] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);

  // Map markers
  const [markers, setMarkers] = useState([]);
  const [routePolyline, setRoutePolyline] = useState(null);

  // Load saved addresses
  useEffect(() => {
    getSavedAddresses();
  }, [getSavedAddresses]);

  // Calculate route when both locations are set
  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      calculateRoute();
    }
  }, [pickupLocation, destinationLocation]);

  // Calculate fare when distance or ride type changes
  useEffect(() => {
    if (estimatedDistance > 0 && selectedRideType) {
      const selectedRide = rideTypes.find(type => type.id === selectedRideType);
      const fare = calculateFare(estimatedDistance, selectedRide);
      setEstimatedFare(fare);
    }
  }, [estimatedDistance, selectedRideType]);

  // Update nearby drivers when pickup location or ride type changes
  useEffect(() => {
    if (pickupLocation && activeStep === 1) {
      // Find nearby drivers for the selected ride type
      getNearbyDrivers(
        pickupLocation.lng,
        pickupLocation.lat,
        selectedRideType,
        5 // 5km radius
      );
    }
  }, [pickupLocation, selectedRideType, activeStep, getNearbyDrivers]);

  // Update map markers when locations change
  useEffect(() => {
    const newMarkers = [];
    
    if (pickupLocation) {
      newMarkers.push({
        id: 'pickup',
        position: { lat: pickupLocation.lat, lng: pickupLocation.lng },
        title: 'Pickup Location',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
        }
      });
    }
    
    if (destinationLocation) {
      newMarkers.push({
        id: 'destination',
        position: { lat: destinationLocation.lat, lng: destinationLocation.lng },
        title: 'Destination',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }
      });
    }
    
    // Add nearby driver markers
    if (nearbyDrivers && nearbyDrivers.length > 0 && activeStep >= 1) {
      nearbyDrivers.forEach((driver, index) => {
        newMarkers.push({
          id: `driver-${driver._id}`,
          position: { 
            lat: driver.currentLocation.coordinates[1], 
            lng: driver.currentLocation.coordinates[0] 
          },
          title: `Driver: ${driver.user.name}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          }
        });
      });
    }
    
    setMarkers(newMarkers);
  }, [pickupLocation, destinationLocation, nearbyDrivers, activeStep]);

  // Calculate route between pickup and destination
  const calculateRoute = useCallback(async () => {
    if (!pickupLocation || !destinationLocation) return;
    
    try {
      // Use LocationIQ Directions API to calculate route
      const response = await fetch(
        `https://api.locationiq.com/v1/directions/driving/` +
        `${pickupLocation.lng},${pickupLocation.lat};${destinationLocation.lng},${destinationLocation.lat}` +
        `?key=pk.c61dfc5608103dcf469a185a22842c95&steps=false&overview=full&geometries=geojson`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Convert distance from meters to kilometers
        const distanceKm = route.distance / 1000;
        // Convert duration from seconds to minutes
        const durationMin = Math.ceil(route.duration / 60);
        
        setEstimatedDistance(distanceKm);
        setEstimatedDuration(durationMin);
        
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
  }, [pickupLocation, destinationLocation]);

  // Calculate fare based on distance and ride type
  const calculateFare = (distanceKm, rideType) => {
    const { basePrice, pricePerKm } = rideType;
    const fare = basePrice + (distanceKm * pricePerKm);
    return Math.round(fare * 100) / 100; // Round to 2 decimal places
  };

  // Use current location as pickup
  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocode to get address
            const geocoder = new window.google.maps.Geocoder();
            const latlng = { lat: latitude, lng: longitude };
            
            geocoder.geocode({ location: latlng }, (results, status) => {
              if (status === 'OK' && results[0]) {
                setPickupAddress(results[0].formatted_address);
                setPickupLocation({ lat: latitude, lng: longitude });
              } else {
                console.error('Geocoder failed due to: ' + status);
              }
            });
          } catch (error) {
            console.error('Error getting address:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  // Handle geocoding an address to get coordinates
  const geocodeAddress = (address, setLocation) => {
    if (!address) return;
    
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        setLocation({ 
          lat: location.lat(), 
          lng: location.lng() 
        });
      } else {
        console.error('Geocoder failed due to: ' + status);
      }
    });
  };

  // Handle address selection from PlaceAutocomplete
  const handlePickupPlaceSelect = (place) => {
    if (!place) return;
    
    setPickupAddress(place.description);
    setPickupLocation(place.location);
  };
  
  const handleDestinationPlaceSelect = (place) => {
    if (!place) return;
    
    setDestinationAddress(place.description);
    setDestinationLocation(place.location);
  };

  // Handle selecting a saved address
  const handleSelectSavedAddress = (address, isPickup) => {
    if (isPickup) {
      setPickupAddress(address.address);
      setPickupLocation({ 
        lat: address.location.coordinates[1], 
        lng: address.location.coordinates[0] 
      });
      setShowSavedPickupAddresses(false);
    } else {
      setDestinationAddress(address.address);
      setDestinationLocation({ 
        lat: address.location.coordinates[1], 
        lng: address.location.coordinates[0] 
      });
      setShowSavedDestinationAddresses(false);
    }
  };

  // Handle click on map to set location
  const handleMapClick = (location) => {
    if (activeStep === 0) {
      if (!pickupLocation) {
        setPickupLocation(location);
        
        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat: location.lat, lng: location.lng };
        
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setPickupAddress(results[0].formatted_address);
          }
        });
      } else if (!destinationLocation) {
        setDestinationLocation(location);
        
        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat: location.lat, lng: location.lng };
        
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setDestinationAddress(results[0].formatted_address);
          }
        });
      }
    }
  };

  // Handle next step
  const handleNext = () => {
    if (activeStep === 0) {
      if (!pickupLocation || !destinationLocation) {
        alert('Please enter both pickup and destination locations');
        return;
      }
    }
    
    if (activeStep === 1) {
      if (!selectedRideType) {
        alert('Please select a ride type');
        return;
      }
    }
    
    if (activeStep === 2) {
      setConfirmationDialogOpen(true);
      return;
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Handle request ride
  const handleRequestRide = async () => {
    setConfirmationDialogOpen(false);
    setSearchingDrivers(true);
    
    const rideData = {
      pickup: {
        address: pickupAddress,
        location: {
          type: 'Point',
          coordinates: [pickupLocation.lng, pickupLocation.lat]
        }
      },
      destination: {
        address: destinationAddress,
        location: {
          type: 'Point',
          coordinates: [destinationLocation.lng, destinationLocation.lat]
        }
      },
      rideType: selectedRideType,
      estimatedDistance,
      estimatedDuration,
      fare: {
        estimatedFare,
        currency: 'USD'
      }
    };
    
    const ride = await requestRide(rideData);
    
    if (ride) {
      navigate(`/rides/${ride._id}`);
    } else {
      setSearchingDrivers(false);
    }
  };

  // First step content - Entering locations
  const renderLocationStep = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Where would you like to go?
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Stack spacing={2}>
            {/* Pickup location input */}
            <Box sx={{ position: 'relative' }}>
              <PlaceAutocomplete
                label="Pickup Location"
                placeholder="Enter pickup address"
                value={{ description: pickupAddress }}
                onChange={handlePickupPlaceSelect}
                required
                error={activeStep === 0 && !pickupLocation && !pickupAddress}
                helperText={activeStep === 0 && !pickupLocation && !pickupAddress ? "Pickup location is required" : ""}
              />
              
              <Box sx={{ position: 'absolute', right: 48, top: 8 }}>
                <IconButton
                  onClick={() => setShowSavedPickupAddresses(!showSavedPickupAddresses)}
                  color="primary"
                  size="small"
                >
                  <SearchIcon />
                </IconButton>
              </Box>
              
              {showSavedPickupAddresses && savedAddresses.length > 0 && (
                <AddressMenu
                  addresses={savedAddresses}
                  onSelect={(address) => handleSelectSavedAddress(address, true)}
                  onClose={() => setShowSavedPickupAddresses(false)}
                />
              )}
            </Box>
            
            {/* Destination location input */}
            <Box sx={{ position: 'relative' }}>
              <PlaceAutocomplete
                label="Destination"
                placeholder="Enter destination address"
                value={{ description: destinationAddress }}
                onChange={handleDestinationPlaceSelect}
                required
                error={activeStep === 0 && !destinationLocation && !destinationAddress}
                helperText={activeStep === 0 && !destinationLocation && !destinationAddress ? "Destination is required" : ""}
              />
              
              <Box sx={{ position: 'absolute', right: 48, top: 8 }}>
                <IconButton
                  onClick={() => setShowSavedDestinationAddresses(!showSavedDestinationAddresses)}
                  color="primary"
                  size="small"
                >
                  <SearchIcon />
                </IconButton>
              </Box>
              
              {showSavedDestinationAddresses && savedAddresses.length > 0 && (
                <AddressMenu
                  addresses={savedAddresses}
                  onSelect={(address) => handleSelectSavedAddress(address, false)}
                  onClose={() => setShowSavedDestinationAddresses(false)}
                />
              )}
            </Box>
          </Stack>
        </Grid>
        
        {/* Current location button */}
        <Grid item xs={12}>
          <Button
            startIcon={<MyLocationIcon />}
            onClick={useCurrentLocation}
            sx={{ mt: 1 }}
          >
            Use My Current Location as Pickup
          </Button>
        </Grid>
        
        {/* Map */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Or select locations on the map
          </Typography>
          
          <Paper elevation={2} sx={{ p: 2, height: 400, position: 'relative' }}>
            <MapComponent
              height="100%"
              markers={markers}
              polyline={routePolyline}
              center={getMapCenter()}
              zoom={12}
              onClick={handleMapClick}
              showCurrentLocation={false}
            />
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Get step content based on current step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderLocationStep();
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Ride Type
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={selectedRideType}
                onChange={(e) => setSelectedRideType(e.target.value)}
              >
                <Grid container spacing={2}>
                  {rideTypes.map((type) => {
                    const TypeIcon = type.icon;
                    const rideTypeFare = calculateFare(estimatedDistance, type);
                    
                    return (
                      <Grid item xs={12} key={type.id}>
                        <Paper
                          elevation={selectedRideType === type.id ? 3 : 1}
                          sx={{
                            p: 2,
                            border: selectedRideType === type.id ? '2px solid' : '1px solid',
                            borderColor: selectedRideType === type.id ? 'primary.main' : 'divider',
                            borderRadius: 2
                          }}
                        >
                          <FormControlLabel
                            value={type.id}
                            control={<Radio />}
                            label={
                              <Grid container spacing={2} alignItems="center">
                                <Grid item>
                                  <TypeIcon fontSize="large" color="primary" />
                                </Grid>
                                <Grid item xs>
                                  <Typography variant="h6" component="div">
                                    {type.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {type.description}
                                  </Typography>
                                </Grid>
                                <Grid item>
                                  <Typography variant="h6" component="div">
                                    ${rideTypeFare.toFixed(2)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {type.eta} min ETA
                                  </Typography>
                                </Grid>
                              </Grid>
                            }
                            sx={{ width: '100%', m: 0 }}
                          />
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </RadioGroup>
            </FormControl>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body1" gutterBottom>
                {nearbyDrivers?.length || 0} drivers available nearby
              </Typography>
            </Box>
          </Box>
        );
      
      case 2:
        // Find the selected ride type details
        const selectedRide = rideTypes.find(type => type.id === selectedRideType);
        
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirm Ride Details
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Pickup
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {pickupAddress}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Destination
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {destinationAddress}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">
                      Ride Type
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {selectedRide?.icon && React.createElement(selectedRide.icon, { sx: { mr: 1 } })}
                      <Typography variant="body1">
                        {selectedRide?.name}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">
                      ETA
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {selectedRide?.eta} minutes
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">
                      Distance
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {estimatedDistance.toFixed(1)} km
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">
                      Duration
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {estimatedDuration} minutes
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        Estimated Fare
                      </Typography>
                      <Typography variant="h5" color="primary.main">
                        ${estimatedFare.toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );
      
      default:
        return 'Unknown step';
    }
  };

  // Map center based on current step
  const getMapCenter = () => {
    if (pickupLocation && destinationLocation) {
      // Center between pickup and destination
      return {
        lat: (pickupLocation.lat + destinationLocation.lat) / 2,
        lng: (pickupLocation.lng + destinationLocation.lng) / 2
      };
    } else if (pickupLocation) {
      return pickupLocation;
    } else if (destinationLocation) {
      return destinationLocation;
    }
    
    // Default to current location or a default location
    return null; // Will use default location
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Book a Ride
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {error && (
              <Box sx={{ mb: 3 }}>
                <Typography color="error">{error}</Typography>
              </Box>
            )}
            
            {searchingDrivers ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="h6" align="center" gutterBottom>
                  Finding you a driver...
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  Please wait while we connect you with a nearby driver
                </Typography>
              </Box>
            ) : (
              <>
                {getStepContent(activeStep)}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={loading}
                    endIcon={activeStep < 2 ? <KeyboardArrowRightIcon /> : null}
                  >
                    {activeStep === steps.length - 1 ? 'Request Ride' : 'Next'}
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
            <Box sx={{ height: 500 }}>
              <MapComponent
                height="100%"
                width="100%"
                center={getMapCenter()}
                zoom={13}
                markers={markers}
                polyline={routePolyline}
                onClick={handleMapClick}
                showCurrentLocation={activeStep === 0 && !pickupLocation}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Ride Request</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you ready to request this ride? Once you confirm, we'll start looking for a driver.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Estimated fare: ${estimatedFare.toFixed(2)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRequestRide} 
            variant="contained" 
            color="primary"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookRide; 