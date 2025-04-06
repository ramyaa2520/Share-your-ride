import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Avatar,
  Divider,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { useDriverStore } from '../../store/driverStore';
import { useAuthStore } from '../../store/authStore';
import { formatPhoneNumber } from '../../utils/formatters';

const Profile = () => {
  const { user } = useAuthStore();
  const { driverInfo, getDriverInfo, updateDriverProfile, loading, error } = useDriverStore();
  
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    licensePlate: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Fetch driver info on component mount
  useEffect(() => {
    getDriverInfo();
  }, [getDriverInfo]);
  
  // Update form data when driver info is loaded
  useEffect(() => {
    if (driverInfo && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        vehicleMake: driverInfo.vehicle?.make || '',
        vehicleModel: driverInfo.vehicle?.model || '',
        vehicleYear: driverInfo.vehicle?.year || '',
        vehicleColor: driverInfo.vehicle?.color || '',
        licensePlate: driverInfo.vehicle?.licensePlate || ''
      });
    }
  }, [driverInfo, user]);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phoneNumber.replace(/\D/g, ''))) {
      errors.phoneNumber = 'Phone number must be 10 digits';
    }
    
    if (!formData.vehicleMake.trim()) {
      errors.vehicleMake = 'Vehicle make is required';
    }
    
    if (!formData.vehicleModel.trim()) {
      errors.vehicleModel = 'Vehicle model is required';
    }
    
    if (!formData.vehicleYear.toString().trim()) {
      errors.vehicleYear = 'Vehicle year is required';
    }
    
    if (!formData.vehicleColor.trim()) {
      errors.vehicleColor = 'Vehicle color is required';
    }
    
    if (!formData.licensePlate.trim()) {
      errors.licensePlate = 'License plate is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const profileData = {
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      vehicle: {
        make: formData.vehicleMake,
        model: formData.vehicleModel,
        year: formData.vehicleYear,
        color: formData.vehicleColor,
        licensePlate: formData.licensePlate
      }
    };
    
    const success = await updateDriverProfile(profileData);
    if (success) {
      setEditMode(false);
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    setFormErrors({});
  };
  
  // Cancel edit
  const handleCancel = () => {
    // Reset form data to original values
    if (driverInfo && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        vehicleMake: driverInfo.vehicle?.make || '',
        vehicleModel: driverInfo.vehicle?.model || '',
        vehicleYear: driverInfo.vehicle?.year || '',
        vehicleColor: driverInfo.vehicle?.color || '',
        licensePlate: driverInfo.vehicle?.licensePlate || ''
      });
    }
    setEditMode(false);
    setFormErrors({});
  };
  
  // If loading, show loading spinner
  if (loading && !driverInfo) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Driver Profile
          </Typography>
          
          {!editMode ? (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={toggleEditMode}
            >
              Edit Profile
            </Button>
          ) : (
            <Box>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                onClick={handleCancel}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            </Box>
          )}
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Avatar
              sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
              alt={user?.name}
              src={user?.avatar}
            >
              {user?.name?.charAt(0) || 'D'}
            </Avatar>
            
            <Typography variant="h6" gutterBottom>
              {user?.name || 'Driver Name'}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Driver ID: {user?._id?.substring(0, 8) || 'N/A'}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small" disabled>
                Change Photo
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editMode}
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
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editMode}
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
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={!editMode}
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
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Vehicle Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Make"
                  name="vehicleMake"
                  value={formData.vehicleMake}
                  onChange={handleChange}
                  disabled={!editMode}
                  error={!!formErrors.vehicleMake}
                  helperText={formErrors.vehicleMake}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Model"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  disabled={!editMode}
                  error={!!formErrors.vehicleModel}
                  helperText={formErrors.vehicleModel}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Year"
                  name="vehicleYear"
                  type="number"
                  value={formData.vehicleYear}
                  onChange={handleChange}
                  disabled={!editMode}
                  error={!!formErrors.vehicleYear}
                  helperText={formErrors.vehicleYear}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Color"
                  name="vehicleColor"
                  value={formData.vehicleColor}
                  onChange={handleChange}
                  disabled={!editMode}
                  error={!!formErrors.vehicleColor}
                  helperText={formErrors.vehicleColor}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="License Plate"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  disabled={!editMode}
                  error={!!formErrors.licensePlate}
                  helperText={formErrors.licensePlate}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Profile; 