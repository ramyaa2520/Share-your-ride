import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import KingBedIcon from '@mui/icons-material/KingBed';
import { useAuthStore } from '../../store/authStore';

// Steps for driver registration
const steps = ['Account Information', 'Vehicle Information'];

// Vehicle types
const vehicleTypes = ['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Van'];

// Vehicle makes
const vehicleMakes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Hyundai', 'Nissan', 'BMW', 'Mercedes', 'Audi', 'Other'];

// Years range
const years = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i);

const DriverSignup = () => {
  const navigate = useNavigate();
  const { driverSignup, isAuthenticated, loading, error, clearError } = useAuthStore();
  
  // Step state
  const [activeStep, setActiveStep] = useState(0);
  
  // Account information
  const [accountInfo, setAccountInfo] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  
  // Vehicle information
  const [vehicleInfo, setVehicleInfo] = useState({
    type: '',
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/driver/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // Clear errors when unmounting
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);
  
  // Handle account info change
  const handleAccountChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = name === 'agreeToTerms' ? checked : value;
    
    setAccountInfo({
      ...accountInfo,
      [name]: newValue
    });
    
    // Clear errors for the field being changed
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
    
    // Clear API error when user starts typing again
    if (error) {
      clearError();
    }
  };
  
  // Handle vehicle info change
  const handleVehicleChange = (e) => {
    const { name, value } = e.target;
    
    setVehicleInfo({
      ...vehicleInfo,
      [name]: value
    });
    
    // Clear errors for the field being changed
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  // Validate account information
  const validateAccountInfo = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    
    if (!accountInfo.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!accountInfo.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(accountInfo.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!accountInfo.phoneNumber) {
      errors.phoneNumber = 'Phone number is required for drivers';
    } else if (!phoneRegex.test(accountInfo.phoneNumber.replace(/\D/g, ''))) {
      errors.phoneNumber = 'Phone number must be 10 digits';
    }
    
    if (!accountInfo.password) {
      errors.password = 'Password is required';
    } else if (accountInfo.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!accountInfo.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (accountInfo.password !== accountInfo.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!accountInfo.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Validate vehicle information
  const validateVehicleInfo = () => {
    const errors = {};
    
    if (!vehicleInfo.type) {
      errors.type = 'Vehicle type is required';
    }
    
    if (!vehicleInfo.make) {
      errors.make = 'Vehicle make is required';
    }
    
    if (!vehicleInfo.model.trim()) {
      errors.model = 'Vehicle model is required';
    }
    
    if (!vehicleInfo.year) {
      errors.year = 'Vehicle year is required';
    }
    
    if (!vehicleInfo.color.trim()) {
      errors.color = 'Vehicle color is required';
    }
    
    if (!vehicleInfo.licensePlate.trim()) {
      errors.licensePlate = 'License plate is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle next step
  const handleNext = () => {
    if (activeStep === 0) {
      if (validateAccountInfo()) {
        setActiveStep(1);
      }
    } else if (activeStep === 1) {
      handleSubmit();
    }
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    clearError();
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateVehicleInfo()) {
      return;
    }
    
    // Create driver data object
    const driverData = {
      ...accountInfo,
      vehicle: {
        type: vehicleInfo.type,
        make: vehicleInfo.make,
        model: vehicleInfo.model,
        year: vehicleInfo.year,
        color: vehicleInfo.color,
        licensePlate: vehicleInfo.licensePlate
      }
    };
    
    // Remove confirmPassword and agreeToTerms
    delete driverData.confirmPassword;
    delete driverData.agreeToTerms;
    
    await driverSignup(driverData);
  };
  
  // Get step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                value={accountInfo.name}
                onChange={handleAccountChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={accountInfo.email}
                onChange={handleAccountChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="phoneNumber"
                label="Phone Number"
                name="phoneNumber"
                autoComplete="tel"
                value={accountInfo.phoneNumber}
                onChange={handleAccountChange}
                error={!!formErrors.phoneNumber}
                helperText={formErrors.phoneNumber}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={accountInfo.password}
                onChange={handleAccountChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={accountInfo.confirmPassword}
                onChange={handleAccountChange}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="agreeToTerms"
                    checked={accountInfo.agreeToTerms}
                    onChange={handleAccountChange}
                    color="primary"
                  />
                }
                label="I agree to the terms and conditions for drivers"
              />
              {formErrors.agreeToTerms && (
                <Typography variant="caption" color="error">
                  {formErrors.agreeToTerms}
                </Typography>
              )}
            </Grid>
          </Grid>
        );
      
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!formErrors.type}>
                <InputLabel id="vehicle-type-label">Vehicle Type</InputLabel>
                <Select
                  labelId="vehicle-type-label"
                  id="type"
                  name="type"
                  value={vehicleInfo.type}
                  label="Vehicle Type"
                  onChange={handleVehicleChange}
                >
                  {vehicleTypes.map((type) => (
                    <MenuItem key={type} value={type.toLowerCase()}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.type && (
                  <Typography variant="caption" color="error">
                    {formErrors.type}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!formErrors.make}>
                <InputLabel id="vehicle-make-label">Vehicle Make</InputLabel>
                <Select
                  labelId="vehicle-make-label"
                  id="make"
                  name="make"
                  value={vehicleInfo.make}
                  label="Vehicle Make"
                  onChange={handleVehicleChange}
                >
                  {vehicleMakes.map((make) => (
                    <MenuItem key={make} value={make.toLowerCase()}>
                      {make}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.make && (
                  <Typography variant="caption" color="error">
                    {formErrors.make}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="model"
                label="Vehicle Model"
                value={vehicleInfo.model}
                onChange={handleVehicleChange}
                error={!!formErrors.model}
                helperText={formErrors.model}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DirectionsCarIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!formErrors.year}>
                <InputLabel id="vehicle-year-label">Vehicle Year</InputLabel>
                <Select
                  labelId="vehicle-year-label"
                  id="year"
                  name="year"
                  value={vehicleInfo.year}
                  label="Vehicle Year"
                  onChange={handleVehicleChange}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.year && (
                  <Typography variant="caption" color="error">
                    {formErrors.year}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="color"
                label="Vehicle Color"
                value={vehicleInfo.color}
                onChange={handleVehicleChange}
                error={!!formErrors.color}
                helperText={formErrors.color}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ColorLensIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="licensePlate"
                label="License Plate"
                value={vehicleInfo.licensePlate}
                onChange={handleVehicleChange}
                error={!!formErrors.licensePlate}
                helperText={formErrors.licensePlate}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KingBedIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );
      
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2
      }}
    >
      <Grid container justifyContent="center">
        <Grid item xs={12} sm={10} md={8} lg={6}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <DirectionsCarIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Become a Driver
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign up to start earning money as a driver
              </Typography>
            </Box>
            
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box component="form">
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
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : activeStep === steps.length - 1 ? (
                    'Submit'
                  ) : (
                    'Next'
                  )}
                </Button>
              </Box>
            </Box>
            
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  Sign In
                </Link>
              </Typography>
              
              <Typography variant="body2" sx={{ mt: 1 }}>
                Just want to ride?{' '}
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  Sign Up as Passenger
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DriverSignup; 