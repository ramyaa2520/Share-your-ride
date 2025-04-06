import { create } from 'zustand';
import { toast } from 'react-toastify';
import axios from 'axios';

export const useUserStore = create((set, get) => ({
  savedAddresses: [],
  paymentMethods: [],
  loading: false,
  error: null,

  // Get user's saved addresses
  getSavedAddresses: async () => {
    try {
      set({ loading: true });
      
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const { user } = response.data.data;
      
      set({
        savedAddresses: user.savedAddresses || [],
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching saved addresses:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch saved addresses'
      });
      toast.error(error.response?.data?.message || 'Failed to fetch saved addresses');
    }
  },

  // Add a saved address
  addSavedAddress: async (addressData) => {
    try {
      set({ loading: true });
      
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/users/saved-addresses', addressData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      set({
        savedAddresses: response.data.data.savedAddresses,
        loading: false,
        error: null
      });

      toast.success('Address saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving address:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to save address'
      });
      toast.error(error.response?.data?.message || 'Failed to save address');
      return false;
    }
  },

  // Remove a saved address
  removeSavedAddress: async (addressId) => {
    try {
      set({ loading: true });
      
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(`/api/users/saved-addresses/${addressId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      set({
        savedAddresses: response.data.data.savedAddresses,
        loading: false,
        error: null
      });

      toast.success('Address removed');
      return true;
    } catch (error) {
      console.error('Error removing address:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to remove address'
      });
      toast.error(error.response?.data?.message || 'Failed to remove address');
      return false;
    }
  },

  // Get user's payment methods
  getPaymentMethods: async () => {
    try {
      set({ loading: true });
      
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const { user } = response.data.data;
      
      set({
        paymentMethods: user.paymentMethods || [],
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch payment methods'
      });
      toast.error(error.response?.data?.message || 'Failed to fetch payment methods');
    }
  },

  // Add a payment method
  addPaymentMethod: async (paymentData) => {
    try {
      set({ loading: true });
      
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/users/payment-methods', paymentData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      set({
        paymentMethods: response.data.data.paymentMethods,
        loading: false,
        error: null
      });

      toast.success('Payment method added successfully');
      return true;
    } catch (error) {
      console.error('Error adding payment method:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to add payment method'
      });
      toast.error(error.response?.data?.message || 'Failed to add payment method');
      return false;
    }
  },

  // Remove a payment method
  removePaymentMethod: async (methodId) => {
    try {
      set({ loading: true });
      
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(`/api/users/payment-methods/${methodId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      set({
        paymentMethods: response.data.data.paymentMethods,
        loading: false,
        error: null
      });

      toast.success('Payment method removed');
      return true;
    } catch (error) {
      console.error('Error removing payment method:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to remove payment method'
      });
      toast.error(error.response?.data?.message || 'Failed to remove payment method');
      return false;
    }
  },

  // Set default payment method
  setDefaultPaymentMethod: async (methodId) => {
    try {
      set({ loading: true });
      
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(`/api/users/payment-methods/${methodId}/set-default`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      set({
        paymentMethods: response.data.data.paymentMethods,
        loading: false,
        error: null
      });

      toast.success('Default payment method updated');
      return true;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to update default payment method'
      });
      toast.error(error.response?.data?.message || 'Failed to update default payment method');
      return false;
    }
  },

  // Update user's location
  updateLocation: async (coordinates) => {
    try {
      set({ loading: true });
      
      const token = localStorage.getItem('token');
      
      await axios.patch('/api/users/update-location', { coordinates }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      set({
        loading: false,
        error: null
      });

      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to update location'
      });
      toast.error(error.response?.data?.message || 'Failed to update location');
      return false;
    }
  },

  // Clear errors
  clearError: () => set({ error: null })
})); 