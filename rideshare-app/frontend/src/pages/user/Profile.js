import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Avatar,
  CircularProgress,
  Divider,
  Alert,
  Card,
  CardContent,
  MenuItem,
  InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import SecurityIcon from '@mui/icons-material/Security';
import { useAuthStore } from '../../store/authStore';

// Country codes
const countryCodes = [
  { code: '+91', country: 'India' },
  { code: '+1', country: 'USA' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'Australia' },
  { code: '+86', country: 'China' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+971', country: 'UAE' }
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, loading, error, clearError } = useAuthStore();
  
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneCountryCode: '+91',
    phoneNumber: '',
    profileImage: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  
  // Set form data when user data is available
  useEffect(() => {
    if (user) {
      // Extract country code and phone number if available
      let countryCode = '+91'; // Default to India
      let phoneNum = '';
      
      if (user.phoneNumber) {
        // Check if the phone number starts with a country code
        const phoneMatch = user.phoneNumber.match(/^(\+\d+)(.*)$/);
        if (phoneMatch) {
          countryCode = phoneMatch[1];
          phoneNum = phoneMatch[2];
        } else {
          phoneNum = user.phoneNumber;
        }
      }
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phoneCountryCode: countryCode,
        phoneNumber: phoneNum,
        profileImage: user.profileImage || ''
      });
    }
  }, [user]);
  
  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
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
    
    if (!formData.phoneNumber) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phoneNumber.replace(/\D/g, ''))) {
      errors.phoneNumber = 'Phone number must be 10 digits';
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
    
    clearError();
    
    // Combine country code and phone number
    const fullPhoneNumber = `${formData.phoneCountryCode}${formData.phoneNumber}`;
    
    const profileData = {
      ...formData,
      phoneNumber: fullPhoneNumber
    };
    
    const success = await updateProfile(profileData);
    
    if (success) {
      setEditMode(false);
      setSuccessMessage('Profile updated successfully');
    }
  };
  
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
            <Avatar
              src={user.profileImage}
              alt={user.name}
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: 64
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : <PersonIcon fontSize="large" />}
            </Avatar>
            
            <Typography variant="h5" gutterBottom>
              {user.name}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user.email}
            </Typography>
            
            {!editMode && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
                sx={{ mt: 2 }}
              >
                Edit Profile
              </Button>
            )}
          </Paper>
          
          {user.role === 'driver' && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Driver Information
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">
                    <strong>Status:</strong> {user.driverStatus || 'Not Verified'}
                  </Typography>
                </Box>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/driver/documents')}
                  sx={{ mt: 1 }}
                >
                  Manage Documents
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Account Information</Typography>
              
              {editMode && (
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => setEditMode(false)}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    Save
                  </Button>
                </Box>
              )}
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {editMode ? (
                  <TextField
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    required
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
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon color="action" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      <strong>Name:</strong> {user.name}
                    </Typography>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12}>
                {editMode ? (
                  <TextField
                    label="Email Address"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    required
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
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmailIcon color="action" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      <strong>Email:</strong> {user.email}
                    </Typography>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12}>
                {editMode ? (
                  <Grid container spacing={2}>
                    <Grid item xs={4} sm={3}>
                      <TextField
                        select
                        label="Code"
                        name="phoneCountryCode"
                        value={formData.phoneCountryCode}
                        onChange={handleChange}
                        fullWidth
                      >
                        {countryCodes.map((option) => (
                          <MenuItem key={option.code} value={option.code}>
                            {option.code} ({option.country})
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={8} sm={9}>
                      <TextField
                        label="Phone Number"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        fullWidth
                        required
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
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PhoneIcon color="action" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      <strong>Phone:</strong> {user.phoneNumber || 'Not provided'}
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Security
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Button
                variant="outlined"
                startIcon={<SecurityIcon />}
                onClick={() => navigate('/change-password')}
              >
                Change Password
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 