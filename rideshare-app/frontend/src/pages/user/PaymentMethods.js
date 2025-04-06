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
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { useUserStore } from '../../store/userStore';

const PaymentMethods = () => {
  const { 
    getPaymentMethods, 
    addPaymentMethod, 
    removePaymentMethod, 
    setDefaultPaymentMethod,
    paymentMethods, 
    loading, 
    error 
  } = useUserStore();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    cardName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    isDefault: false
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Load payment methods on mount
  useEffect(() => {
    getPaymentMethods();
  }, [getPaymentMethods]);
  
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
    
    if (!formData.cardName.trim()) {
      errors.cardName = 'Name on card is required';
    }
    
    if (!formData.cardNumber.trim()) {
      errors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
      errors.cardNumber = 'Card number must be 16 digits';
    }
    
    if (!formData.expiryMonth.trim()) {
      errors.expiryMonth = 'Expiry month is required';
    } else if (!/^(0[1-9]|1[0-2])$/.test(formData.expiryMonth)) {
      errors.expiryMonth = 'Invalid month format (must be MM)';
    }
    
    if (!formData.expiryYear.trim()) {
      errors.expiryYear = 'Expiry year is required';
    } else if (!/^\d{4}$/.test(formData.expiryYear)) {
      errors.expiryYear = 'Invalid year format (must be YYYY)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      cardName: '',
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      isDefault: false
    });
    setFormErrors({});
  };
  
  // Handle add payment method
  const handleAddPaymentMethod = async () => {
    if (!validateForm()) {
      return;
    }
    
    // Format card number to mask all but last 4 digits
    const last4 = formData.cardNumber.slice(-4);
    const maskedCardNumber = `xxxx-xxxx-xxxx-${last4}`;
    
    const paymentMethodData = {
      type: 'credit_card',
      cardName: formData.cardName,
      cardNumber: maskedCardNumber,
      expiryMonth: formData.expiryMonth,
      expiryYear: formData.expiryYear,
      isDefault: formData.isDefault
    };
    
    await addPaymentMethod(paymentMethodData);
    handleCloseDialog();
  };
  
  // Handle remove payment method
  const handleRemovePaymentMethod = async (methodId) => {
    if (window.confirm('Are you sure you want to remove this payment method?')) {
      await removePaymentMethod(methodId);
    }
  };
  
  // Handle set default payment method
  const handleSetDefaultPaymentMethod = async (methodId) => {
    await setDefaultPaymentMethod(methodId);
  };
  
  // Format card number for display
  const formatCardNumber = (cardNumber) => {
    if (!cardNumber) return '';
    
    // If already masked with 'xxxx', just return as is
    if (cardNumber.includes('xxxx')) {
      return cardNumber;
    }
    
    // Otherwise, mask all but last 4 digits
    const last4 = cardNumber.slice(-4);
    return `xxxx-xxxx-xxxx-${last4}`;
  };
  
  // Render card expiry
  const renderExpiry = (month, year) => {
    if (!month || !year) return '';
    
    return `${month}/${year.slice(-2)}`;
  };
  
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Payment Methods
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Your Payment Methods
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Add Payment Method
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {paymentMethods && paymentMethods.length > 0 ? (
              <RadioGroup
                value={paymentMethods.find(method => method.isDefault)?._id || ''}
                onChange={(e) => handleSetDefaultPaymentMethod(e.target.value)}
                name="payment-methods-group"
              >
                <Grid container spacing={2}>
                  {paymentMethods.map((method) => (
                    <Grid item xs={12} key={method._id}>
                      <Card 
                        variant="outlined"
                        sx={{
                          borderColor: method.isDefault ? 'primary.main' : 'divider',
                          borderWidth: method.isDefault ? 2 : 1
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FormControlLabel
                                value={method._id}
                                control={<Radio />}
                                label=""
                                sx={{ mr: 0 }}
                              />
                              
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <CreditCardIcon sx={{ mr: 1, color: 'primary.main' }} />
                                  <Typography variant="subtitle1" component="div">
                                    {method.cardName}
                                    {method.isDefault && (
                                      <Typography
                                        component="span"
                                        variant="body2"
                                        color="primary"
                                        sx={{ ml: 1 }}
                                      >
                                        (Default)
                                      </Typography>
                                    )}
                                  </Typography>
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary">
                                  {formatCardNumber(method.cardNumber)}
                                </Typography>
                                
                                <Typography variant="body2" color="text.secondary">
                                  Expires: {renderExpiry(method.expiryMonth, method.expiryYear)}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <IconButton
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemovePaymentMethod(method._id);
                              }}
                              color="error"
                              disabled={method.isDefault}
                              title={method.isDefault ? "Cannot remove default payment method" : "Remove payment method"}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </RadioGroup>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary" paragraph>
                  You don't have any payment methods yet.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setDialogOpen(true)}
                >
                  Add Payment Method
                </Button>
              </Box>
            )}
          </>
        )}
      </Paper>
      
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="cardName"
              label="Name on Card"
              name="cardName"
              value={formData.cardName}
              onChange={handleChange}
              error={!!formErrors.cardName}
              helperText={formErrors.cardName}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="cardNumber"
              label="Card Number"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleChange}
              error={!!formErrors.cardNumber}
              helperText={formErrors.cardNumber}
              inputProps={{ maxLength: 16 }}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="expiryMonth"
                  label="Expiry Month (MM)"
                  name="expiryMonth"
                  value={formData.expiryMonth}
                  onChange={handleChange}
                  error={!!formErrors.expiryMonth}
                  helperText={formErrors.expiryMonth}
                  inputProps={{ maxLength: 2 }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="expiryYear"
                  label="Expiry Year (YYYY)"
                  name="expiryYear"
                  value={formData.expiryYear}
                  onChange={handleChange}
                  error={!!formErrors.expiryYear}
                  helperText={formErrors.expiryYear}
                  inputProps={{ maxLength: 4 }}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Radio
                    checked={formData.isDefault}
                    onChange={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                  />
                }
                label="Set as default payment method"
              />
            </Box>
            
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                This is a simplified demo. In a real application, card information would be securely processed through a payment provider.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleAddPaymentMethod} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Payment Method'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentMethods; 