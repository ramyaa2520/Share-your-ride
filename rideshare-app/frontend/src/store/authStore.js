import { create } from 'zustand';
import { toast } from 'react-toastify';
import axios from 'axios';

// Update the API calls to use environment variable for API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Add a utility function to create axios instance with proper configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add an interceptor to attach the token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Check if we're in development mode without backend
const isDevelopmentWithoutBackend = () => {
  return process.env.REACT_APP_NODE_ENV === 'development' && process.env.REACT_APP_USE_BACKEND !== 'true';
};

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  // Check if user is already authenticated
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      set({ loading: true });
      
      // If in development mode without backend, use the token to simulate auth
      if (isDevelopmentWithoutBackend()) {
        // Get the user data from localStorage if it exists
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          set({
            user,
            isAuthenticated: true,
            loading: false,
            error: null
          });
          return;
        }
        
        // Default user if no userData exists
        set({
          user: {
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
            role: 'user',
            createdAt: new Date().toISOString()
          },
          isAuthenticated: true,
          loading: false,
          error: null
        });
        return;
      }
      
      const response = await api.get('/auth/me');

      if (response.data && response.data.data && response.data.data.user) {
        set({
          user: response.data.data.user,
          isAuthenticated: true,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      localStorage.removeItem('token');
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: error.response?.data?.message || 'Authentication failed'
      });
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      set({ loading: true });
      
      // Development mode simulation
      if (isDevelopmentWithoutBackend()) {
        console.log('Development mode: Simulating successful login');
        
        // Create a fake user
        const fakeUser = {
          id: 'test-user-id',
          name: 'Test User',
          email: email,
          role: 'user',
          createdAt: new Date().toISOString()
        };
        
        // Store user data in localStorage for persistence
        localStorage.setItem('userData', JSON.stringify(fakeUser));
        localStorage.setItem('token', 'fake-test-token');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        set({
          user: fakeUser,
          isAuthenticated: true,
          loading: false,
          error: null
        });

        toast.success('Login successful (Development Mode)');
        return true;
      }
      
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { token, data } = response.data;
      
      // Save token and user data to local storage
      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      set({
        user: data.user,
        isAuthenticated: true,
        loading: false,
        error: null
      });

      toast.success('Login successful');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Login failed'
      });
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  },

  // Register user
  register: async (userData) => {
    try {
      set({ loading: true });
      
      // DEVELOPMENT MODE - For testing frontend without backend
      if (isDevelopmentWithoutBackend()) {
        // Simulate successful registration
        console.log('Development mode: Simulating successful registration');
        console.log('User data:', userData);

        // Create a fake user object
        const fakeUser = {
          id: 'test-user-id',
          name: userData.name,
          email: userData.email,
          role: 'user',
          createdAt: new Date().toISOString()
        };

        // Store user data in localStorage for persistence
        localStorage.setItem('userData', JSON.stringify(fakeUser));
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Save fake token
        localStorage.setItem('token', 'fake-test-token');
        
        set({
          user: fakeUser,
          isAuthenticated: true,
          loading: false,
          error: null
        });

        toast.success('Registration successful (Development Mode)');
        return true;
      }

      // PRODUCTION MODE - Real API call
      const response = await api.post('/auth/signup', userData);

      const { token, data } = response.data;
      
      // Save token to local storage
      localStorage.setItem('token', token);
      
      set({
        user: data.user,
        isAuthenticated: true,
        loading: false,
        error: null
      });

      toast.success('Registration successful');
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Registration failed'
      });
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    }
  },

  // Driver signup
  driverSignup: async (driverData) => {
    try {
      set({ loading: true });
      
      // DEVELOPMENT MODE - For testing frontend without backend
      if (isDevelopmentWithoutBackend()) {
        console.log('Development mode: Simulating successful driver registration');
        console.log('Driver data:', driverData);

        // Update user role
        const user = get().user || {
          id: 'test-driver-id',
          name: driverData.name,
          email: driverData.email,
          createdAt: new Date().toISOString()
        };
        
        const updatedUser = { ...user, role: 'driver' };
        
        // Store updated user data in localStorage
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        
        set({
          user: updatedUser,
          loading: false,
          error: null
        });

        toast.success('Driver registration successful (Development Mode)');
        return true;
      }
      
      const response = await api.post('/auth/driver-signup', driverData);

      // Update user role
      const user = get().user;
      
      set({
        user: { ...user, role: 'driver' },
        loading: false,
        error: null
      });

      toast.success('Driver registration successful');
      return true;
    } catch (error) {
      console.error('Driver registration failed:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Driver registration failed'
      });
      toast.error(error.response?.data?.message || 'Driver registration failed');
      return false;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      set({ loading: true });
      
      // DEVELOPMENT MODE
      if (isDevelopmentWithoutBackend()) {
        console.log('Development mode: Simulating successful profile update');
        console.log('Updated user data:', userData);

        // Update user
        const user = get().user || {};
        const updatedUser = { ...user, ...userData };
        
        // Store updated user data in localStorage
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        
        set({
          user: updatedUser,
          loading: false,
          error: null
        });

        toast.success('Profile updated successfully (Development Mode)');
        return true;
      }
      
      const response = await api.patch('/auth/update-me', userData);

      const { user } = response.data.data;
      
      set({
        user,
        loading: false,
        error: null
      });

      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Profile update failed'
      });
      toast.error(error.response?.data?.message || 'Profile update failed');
      return false;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    set({
      user: null,
      isAuthenticated: false,
      error: null
    });
    toast.success('Logged out successfully');
  },

  // Clear errors
  clearError: () => set({ error: null })
})); 