import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  Alert,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import EditIcon from '@mui/icons-material/Edit';
import { useUserStore } from '../../store/userStore';
import MapComponent from '../../components/map/MapComponent';

const SavedAddresses = () => {
  const { 
    getSavedAddresses, 
    addSavedAddress, 
    removeSavedAddress, 
    savedAddresses, 
    loading, 
    error 
  } = useUserStore();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'home',
    location: {
      coordinates: [0, 0]
    }
  });
  const [formErrors, setFormErrors] = useState({});
  const [mapMarkers, setMapMarkers] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Load saved addresses on mount
  useEffect(() => {
    getSavedAddresses();
  }, [getSavedAddresses]);
  
  // Update markers when saved addresses change
  useEffect(() => {
    if (savedAddresses) {
      const markers = savedAddresses.map(address => ({
        id: address._id,
        position: {
          lat: address.location?.coordinates[1] || 0,
          lng: address.location?.coordinates[0] || 0
        },
        title: address.name || address.type,
        icon: getMarkerIconByType(address.type)
      }));
      
      setMapMarkers(markers);
    }
  }, [savedAddresses]);
  
  // Get marker icon based on address type
  const getMarkerIconByType = (type) => {
    switch (type) {
      case 'home':
        return { url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' };
      case 'work':
        return { url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' };
      case 'favorite':
        return { url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png' };
      default:
        return { url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' };
    }
  };
  
  // Get icon component based on address type
  const getIconByType = (type) => {
    switch (type) {
      case 'home':
        return <HomeIcon sx={{ color: 'success.main' }} />;
      case 'work':
        return <WorkIcon sx={{ color: 'info.main' }} />;
      case 'favorite':
        return <StarIcon sx={{ color: 'warning.main' }} />;
      default:
        return <LocationOnIcon sx={{ color: 'error.main' }} />;
    }
  };
  
  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for the field being changed
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      name: '',
      address: '',
      type: 'home',
      location: {
        coordinates: [0, 0]
      }
    });
    setFormErrors({});
    setSelectedLocation(null);
  };
  
  // Handle map click
  const handleMapClick = (location) => {
    setSelectedLocation(location);
    
    // Update form data with selected coordinates
    setFormData({
      ...formData,
      location: {
        coordinates: [location.lng, location.lat]
      }
    });
    
    // Reverse geocode to get address
    if (window.google) {
      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat: location.lat, lng: location.lng };
      
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setFormData(prev => ({
            ...prev,
            address: results[0].formatted_address
          }));
        }
      });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!formData.type) {
      errors.type = 'Type is required';
    }
    
    // Check if location is selected on map
    if (!selectedLocation) {
      errors.location = 'Please select a location on the map';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle add address
  const handleAddAddress = async () => {
    if (!validateForm()) {
      return;
    }
    
    await addSavedAddress(formData);
    handleCloseDialog();
  };
  
  // Handle remove address
  const handleRemoveAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to remove this address?')) {
      await removeSavedAddress(addressId);
    }
  };
  
  // Search for address using geocoder
  const handleSearchAddress = () => {
    if (!formData.address.trim() || !window.google) return;
    
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address: formData.address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        setSelectedLocation({ lat, lng });
        
        setFormData({
          ...formData,
          address: results[0].formatted_address,
          location: {
            coordinates: [lng, lat]
          }
        });
      } else {
        setFormErrors({
          ...formErrors,
          address: 'Could not find address. Please try again or select on map.'
        });
      }
    });
  };
  
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Saved Addresses
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Your Addresses
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
              >
                Add Address
              </Button>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {savedAddresses && savedAddresses.length > 0 ? (
                  <Grid container spacing={2}>
                    {savedAddresses.map((address) => (
                      <Grid item xs={12} key={address._id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Box sx={{ mr: 2, mt: 0.5 }}>
                                  {getIconByType(address.type)}
                                </Box>
                                
                                <Box>
                                  <Typography variant="subtitle1" component="div" sx={{ textTransform: 'capitalize' }}>
                                    {address.name || address.type}
                                  </Typography>
                                  
                                  <Typography variant="body2" color="text.secondary">
                                    {address.address}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <IconButton
                                onClick={() => handleRemoveAddress(address._id)}
                                color="error"
                                title="Remove address"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      You don't have any saved addresses yet.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setDialogOpen(true)}
                    >
                      Add Address
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ px: 1 }}>
              Your Address Locations
            </Typography>
            
            <Box sx={{ height: 400, mt: 2 }}>
              <MapComponent
                height="100%"
                width="100%"
                markers={mapMarkers}
                zoom={12}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New Address</DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box component="form" sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Address Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  placeholder="E.g., Home, Office, Gym"
                />
                
                <FormControl fullWidth margin="normal" error={!!formErrors.type}>
                  <InputLabel id="address-type-label">Address Type</InputLabel>
                  <Select
                    labelId="address-type-label"
                    id="type"
                    name="type"
                    value={formData.type}
                    label="Address Type"
                    onChange={handleChange}
                  >
                    <MenuItem value="home">Home</MenuItem>
                    <MenuItem value="work">Work</MenuItem>
                    <MenuItem value="favorite">Favorite</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                  {formErrors.type && <FormHelperText>{formErrors.type}</FormHelperText>}
                </FormControl>
                
                <Box sx={{ display: 'flex', mt: 2 }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="address"
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    error={!!formErrors.address}
                    helperText={formErrors.address}
                    placeholder="Enter address or select on map"
                  />
                  <Button 
                    sx={{ mt: 2, ml: 1 }} 
                    variant="outlined"
                    onClick={handleSearchAddress}
                  >
                    Search
                  </Button>
                </Box>
                
                {formErrors.location && (
                  <FormHelperText error>{formErrors.location}</FormHelperText>
                )}
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    You can also click directly on the map to set the address location.
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 300, mt: 2 }}>
                <MapComponent
                  height="100%"
                  width="100%"
                  onClick={handleMapClick}
                  markers={selectedLocation ? [
                    {
                      id: 'selected',
                      position: selectedLocation,
                      title: 'Selected Location',
                      icon: getMarkerIconByType(formData.type)
                    }
                  ] : []}
                  showCurrentLocation
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleAddAddress} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Address'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavedAddresses; 