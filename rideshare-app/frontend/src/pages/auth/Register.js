import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Container,
  Card,
  CardContent,
  Snackbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const Register = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { register, isAuthenticated, loading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // Clear errors when unmounting
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);
  
  // Handle form change
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = name === 'agreeToTerms' ? checked : value;
    
    setFormData({
      ...formData,
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
  
  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '' };
    
    if (password.length < 8) return { strength: 0, text: 'Too short' };
    
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (password.length >= 10) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    const strengthTexts = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
    return {
      strength,
      text: strengthTexts[Math.min(strength, 4)]
    };
  };
  
  const passwordStrength = getPasswordStrength(formData.password);
  
  const getPasswordStrengthColor = (strength) => {
    const colors = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2e7d32'];
    return colors[Math.min(strength, 4)];
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
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
    
    // Only include the required fields for registration
    const userData = {
      name: formData.name,
      email: formData.email.toLowerCase().trim(),
      password: formData.password
    };
    
    const success = await register(userData);
    
    if (success) {
      setSuccessMessage('Registration successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  };
  
  // Detect if the error is a duplicate email error
  const isDuplicateEmailError = error && (
    error.toLowerCase().includes('already registered') || 
    error.toLowerCase().includes('email is already') ||
    error.toLowerCase().includes('use a different email')
  );
  
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          mt: isMobile ? 4 : 8,
          mb: isMobile ? 4 : 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Card 
          elevation={3} 
          sx={{ 
            width: '100%', 
            borderRadius: 2, 
            overflow: 'visible',
            position: 'relative' 
          }}
        >
          <Box 
            sx={{ 
              position: 'absolute', 
              top: -30, 
              left: '50%', 
              transform: 'translateX(-50%)', 
              backgroundColor: 'primary.main',
              borderRadius: '50%',
              p: 2,
              boxShadow: 3
            }}
          >
            <DirectionsCarIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          
          <CardContent sx={{ pt: 5, px: isMobile ? 2 : 4, pb: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 4, mt: 2 }}>
              <Typography component="h1" variant="h4" fontWeight="bold" color="primary">
                Create Your Account
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Join our community and start sharing rides today!
              </Typography>
            </Box>
            
            {successMessage && (
              <Alert 
                icon={<CheckCircleOutlineIcon fontSize="inherit" />}
                severity="success" 
                sx={{ mb: 3 }}
              >
                {successMessage}
              </Alert>
            )}
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3 }}
                action={
                  isDuplicateEmailError && (
                    <Button 
                      color="inherit" 
                      size="small" 
                      component={Link} 
                      to="/login"
                      variant="outlined"
                      sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}
                    >
                      Sign In Now
                    </Button>
                  )
                }
              >
                {isDuplicateEmailError 
                  ? (
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Email Already Registered
                      </Typography>
                      <Typography variant="body2">
                        This email address is already in use. Please use a different email or sign in to your existing account.
                      </Typography>
                    </Box>
                  )
                  : error
                }
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    name="name"
                    label="Full Name"
                    fullWidth
                    required
                    value={formData.name}
                    onChange={handleChange}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    disabled={loading}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    name="email"
                    label="Email Address"
                    type="email"
                    fullWidth
                    required
                    value={formData.email}
                    onChange={handleChange}
                    error={!!formErrors.email || isDuplicateEmailError}
                    helperText={formErrors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    disabled={loading}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    name="password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    required
                    value={formData.password}
                    onChange={handleChange}
                    error={!!formErrors.password}
                    helperText={
                      formErrors.password || 
                      (formData.password && 
                        `Password strength: ${passwordStrength.text}`)
                    }
                    FormHelperTextProps={{
                      sx: formData.password && !formErrors.password ? {
                        color: getPasswordStrengthColor(passwordStrength.strength)
                      } : {}
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            disabled={loading}
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    disabled={loading}
                    variant="outlined"
                  />
                  
                  {formData.password && (
                    <Box sx={{ mt: 1, mb: 1, width: '100%', height: 4, backgroundColor: '#e0e0e0', borderRadius: 5 }}>
                      <Box 
                        sx={{ 
                          height: '100%', 
                          width: `${(passwordStrength.strength + 1) * 20}%`, 
                          backgroundColor: getPasswordStrengthColor(passwordStrength.strength),
                          borderRadius: 5,
                          transition: 'width 0.3s ease-in-out'
                        }} 
                      />
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    fullWidth
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={!!formErrors.confirmPassword}
                    helperText={formErrors.confirmPassword}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            disabled={loading}
                          >
                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    disabled={loading}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleChange}
                        color="primary"
                        disabled={loading}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I agree to the <Link to="/terms" style={{ textDecoration: 'none', color: theme.palette.primary.main }}>terms and conditions</Link>
                      </Typography>
                    }
                  />
                  {formErrors.agreeToTerms && (
                    <Typography variant="caption" color="error" display="block">
                      {formErrors.agreeToTerms}
                    </Typography>
                  )}
                </Grid>
              </Grid>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Account'}
              </Button>
              
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>
              
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    style={{ 
                      textDecoration: 'none', 
                      color: theme.palette.primary.main,
                      fontWeight: 'bold'
                    }}
                  >
                    Sign In
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Register; 