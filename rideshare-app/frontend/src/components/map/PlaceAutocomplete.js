import React, { useState, useEffect, useRef } from 'react';
import { 
  TextField, 
  Autocomplete, 
  Box, 
  CircularProgress, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Grid,
  Typography 
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import axios from 'axios';
import EditLocationIcon from '@mui/icons-material/EditLocation';

// LocationIQ API key
const API_KEY = 'pk.c61dfc5608103dcf469a185a22842c95';

const PlaceAutocomplete = ({
  label = 'Search Location',
  placeholder = 'Enter a location',
  value = null,
  onChange = null,
  required = false,
  error = false,
  helperText = '',
  fullWidth = true,
  variant = 'outlined',
  size = 'medium',
  city = null,
  countryCode = 'in'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualAddress, setManualAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });
  
  const timeoutRef = useRef(null);

  // Cancel previous requests
  const cancelTokenSourceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (cancelTokenSourceRef.current) {
        cancelTokenSourceRef.current.cancel('Component unmounted');
      }
    };
  }, []);

  // Set initial input value if a value exists
  useEffect(() => {
    if (value && value.description) {
      setInputValue(value.description);
    }
  }, [value]);

  // Handle input change with debounce
  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Cancel previous request
    if (cancelTokenSourceRef.current) {
      cancelTokenSourceRef.current.cancel('New request');
    }

    // Only fetch if we have at least 3 characters
    if (newInputValue.length < 3) {
      setOptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Set new timeout for fetching data
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(newInputValue);
    }, 500); // Debounce for 500ms
  };

  // Fetch suggestions from LocationIQ API
  const fetchSuggestions = async (input) => {
    const cancelTokenSource = axios.CancelToken.source();
    cancelTokenSourceRef.current = cancelTokenSource;

    try {
      // Build the request URL
      let url = `https://api.locationiq.com/v1/autocomplete?key=${API_KEY}&q=${encodeURIComponent(input)}&limit=5&format=json`;

      // Add city bias if provided
      if (city) {
        url += `&bounded=1&countrycodes=${countryCode}&city=${encodeURIComponent(city)}`;
      } else {
        url += `&countrycodes=${countryCode}`;
      }

      const response = await axios.get(url, {
        cancelToken: cancelTokenSource.token
      });

      // Transform the response data to a usable format
      const suggestions = response.data.map(item => ({
        placeId: item.place_id,
        description: item.display_name,
        mainText: item.address?.name || item.display_name.split(',')[0],
        secondaryText: item.display_name.replace(item.address?.name ? item.address.name + ',' : '', '').trim(),
        location: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        },
        addressComponents: item.address,
        formattedAddress: item.display_name
      }));

      setOptions(suggestions);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error fetching location suggestions:', error);
        setOptions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenManualDialog = () => {
    setManualDialogOpen(true);
  };

  const handleCloseManualDialog = () => {
    setManualDialogOpen(false);
  };

  const handleManualAddressChange = (e) => {
    const { name, value } = e.target;
    setManualAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveManualAddress = () => {
    // Combine address parts into a single string
    const fullAddress = [
      manualAddress.street,
      manualAddress.city,
      manualAddress.state,
      manualAddress.zipCode,
      manualAddress.country
    ].filter(Boolean).join(', ');
    
    // Create a place object that matches the expected format
    const placeObject = {
      description: fullAddress,
      formattedAddress: fullAddress,
      location: { lat: null, lng: null }, // Default to null coordinates
      addressComponents: {
        city: manualAddress.city,
        state: manualAddress.state,
        country: manualAddress.country
      }
    };
    
    // Call the onChange handler with the new place object
    onChange(placeObject);
    
    // Update the input value to show the full address
    setInputValue(fullAddress);
    
    // Close the dialog
    setManualDialogOpen(false);
  };

  return (
    <>
      <Box sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
        <Autocomplete
          id="location-autocomplete"
          freeSolo
          filterOptions={(x) => x} // Disable built-in filtering
          getOptionLabel={(option) => 
            typeof option === 'string' ? option : option.description
          }
          options={options}
          autoComplete
          includeInputInList
          filterSelectedOptions
          value={value}
          onChange={(event, newValue) => {
            if (onChange) {
              onChange(newValue);
            }
          }}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          loading={loading}
          isOptionEqualToValue={(option, value) => 
            option.placeId === value.placeId
          }
          renderOption={(props, option) => (
            <li {...props}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <LocationOnIcon sx={{ color: 'text.secondary', mr: 1, mt: 0.25 }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {option.mainText}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {option.secondaryText}
                  </Typography>
                </Box>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              placeholder={placeholder}
              required={required}
              error={error}
              helperText={helperText}
              variant={variant}
              size={size}
              fullWidth={fullWidth}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                    <Button 
                      size="small" 
                      color="primary" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenManualDialog();
                      }}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      <EditLocationIcon fontSize="small" />
                    </Button>
                  </React.Fragment>
                ),
              }}
            />
          )}
        />
      </Box>

      {/* Manual address entry dialog */}
      <Dialog open={manualDialogOpen} onClose={handleCloseManualDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Enter Address Manually</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="street"
                label="Street Address"
                value={manualAddress.street}
                onChange={handleManualAddressChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="city"
                label="City"
                value={manualAddress.city}
                onChange={handleManualAddressChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                name="state"
                label="State"
                value={manualAddress.state}
                onChange={handleManualAddressChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                name="zipCode"
                label="Zip Code"
                value={manualAddress.zipCode}
                onChange={handleManualAddressChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="country"
                label="Country"
                value={manualAddress.country}
                onChange={handleManualAddressChange}
                fullWidth
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseManualDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveManualAddress} 
            variant="contained" 
            color="primary"
            disabled={!manualAddress.street || !manualAddress.city}
          >
            Save Address
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PlaceAutocomplete; 