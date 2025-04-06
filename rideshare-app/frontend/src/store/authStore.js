import { create } from 'zustand';
import { toast } from 'react-toastify';
import axios from 'axios';

// Update the API calls to use environment variable for API URL
const API_URL = process.env.REACT_APP_API_URL || 'https://rideshare-backend-aau6.onrender.com/api';

// Add a utility function to create axios instance with proper configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000, // 15 seconds timeout
  withCredentials: false // Must be false for cross-domain requests
});

// Add an interceptor to attach the token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request for debugging
    console.log('Making API request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('Request error interceptor:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors globally
api.interceptors.response.use(
  (response) => {
    console.log('API response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error in interceptor:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear token on auth errors
      console.log('Authentication error in API response, clearing token');
      localStorage.removeItem('token');
      
      // Optionally redirect to login page if not already on login page
      if (window.location.pathname !== '/login') {
        toast.error('Your session has expired. Please log in again.');
        // Use setTimeout to avoid React state updates during rendering
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

// Check if we're in development mode without backend
const isDevelopmentWithoutBackend = () => {
  return process.env.REACT_APP_NODE_ENV === 'development' && process.env.REACT_APP_USE_BACKEND !== 'true';
};

// Add a function to refresh the auth status periodically
const setupAuthRefresh = (checkAuthFn) => {
  // Set up a periodic check every 5 minutes
  const interval = setInterval(() => {
    const token = localStorage.getItem('token');
    // Only attempt refresh if a token exists
    if (token) {
      checkAuthFn();
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  return interval;
};

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  authInterval: null,

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
        // Update user data in localStorage to keep it fresh
        localStorage.setItem('userData', JSON.stringify(response.data.data.user));
        
        set({
          user: response.data.data.user,
          isAuthenticated: true,
          loading: false,
          error: null
        });
        
        // Setup periodic auth refresh if not already set
        const currentInterval = get().authInterval;
        if (!currentInterval) {
          const interval = setupAuthRefresh(get().checkAuth);
          set({ authInterval: interval });
        }
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      
      // Only clear token if there's an auth error (not network error)
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        
        // Clear the refresh interval
        const currentInterval = get().authInterval;
        if (currentInterval) {
          clearInterval(currentInterval);
          set({ authInterval: null });
        }
      }
      
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
      
      // Setup periodic auth refresh
      const currentInterval = get().authInterval;
      if (currentInterval) {
        clearInterval(currentInterval);
      }
      
      const interval = setupAuthRefresh(get().checkAuth);
      set({ authInterval: interval });

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
      console.log('Registration attempt with data:', userData);
      
      // Format user data correctly
      const formattedUserData = {
        name: userData.name?.trim(),
        email: userData.email?.toLowerCase().trim(),
        password: userData.password
      };
      
      // Validate input data before sending
      if (!formattedUserData.name || !formattedUserData.email || !formattedUserData.password) {
        const missingFields = [];
        if (!formattedUserData.name) missingFields.push('name');
        if (!formattedUserData.email) missingFields.push('email');
        if (!formattedUserData.password) missingFields.push('password');
        
        const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
        set({ loading: false, error: errorMessage });
        toast.error(errorMessage);
        return false;
      }
      
      // Ensure password meets requirements
      if (formattedUserData.password.length < 8) {
        const errorMessage = 'Password must be at least 8 characters long';
        set({ loading: false, error: errorMessage });
        toast.error(errorMessage);
        return false;
      }
      
      set({ loading: true });
      
      // DEVELOPMENT MODE - For testing frontend without backend
      if (isDevelopmentWithoutBackend()) {
        console.log('Development mode: Simulating successful registration');
        console.log('User data:', formattedUserData);

        // Create a fake user object
        const fakeUser = {
          id: 'test-user-id',
          name: formattedUserData.name,
          email: formattedUserData.email,
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
      console.log('Sending registration request to backend:', `${API_URL}/auth/signup`);
      console.log('Registration payload:', JSON.stringify(formattedUserData));
      
      // Clear any previous errors
      set({ error: null });

      try {
        // Try to register the user with the backend
        const response = await api.post('/auth/signup', formattedUserData);
        console.log('Registration response:', response.data);

        // Check if we got a valid response
        if (!response.data) {
          throw new Error('Empty response received from server');
        }

        const { token, data, status } = response.data;
        
        // Check for failure status in response
        if (status === 'fail') {
          throw new Error(response.data.message || 'Registration failed');
        }
        
        // Validate response structure
        if (!token || !data || !data.user) {
          console.error('Invalid response format from API:', response.data);
          throw new Error('Invalid response received from server');
        }
        
        // Save token and user data to local storage
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Update state with user data
        set({
          user: data.user,
          isAuthenticated: true,
          loading: false,
          error: null
        });

        // Show success message
        toast.success('Registration successful! Welcome aboard!');
        return true;
      } catch (apiError) {
        // Handle API errors specifically
        console.error('API Error during registration:', apiError);
        
        if (apiError.response) {
          console.error('API Error response details:', {
            status: apiError.response.status,
            statusText: apiError.response.statusText,
            data: JSON.stringify(apiError.response.data, null, 2)
          });
        }
        
        // Extract the error message from the response
        let errorMessage = 'Registration failed. Please try again.';
        
        if (apiError.response?.data) {
          if (typeof apiError.response.data.message === 'string') {
            errorMessage = apiError.response.data.message;
          } else if (typeof apiError.response.data === 'string') {
            errorMessage = apiError.response.data;
          } else if (apiError.response.data.error) {
            errorMessage = apiError.response.data.error;
          }
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
        
        // Check if it's a duplicate email error
        const isDuplicateEmail = 
          (errorMessage.toLowerCase().includes('email') && 
           (errorMessage.toLowerCase().includes('already') || 
            errorMessage.toLowerCase().includes('duplicate') || 
            errorMessage.toLowerCase().includes('registered'))) ||
          (apiError.response?.status === 400 && apiError.response?.data?.status === 'fail');
        
        if (isDuplicateEmail) {
          errorMessage = 'This email address is already registered. Please use a different email or sign in to your existing account.';
          console.log('Duplicate email detected:', formattedUserData.email);
        }
        
        // Update state with error
        set({
          loading: false,
          error: errorMessage
        });
        
        // Show error toast
        toast.error(errorMessage);
        return false;
      }
    } catch (error) {
      // Catch-all error handler
      console.error('Registration failed:', error);
      console.error('Error details:', {
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      
      // More specific error handling
      let errorMessage = 'Registration failed';
      
      if (error.response?.data?.message) {
        errorMessage = typeof error.response.data.message === 'string' ? 
          error.response.data.message : JSON.stringify(error.response.data.message);
      } else if (error.response?.data?.error) {
        errorMessage = typeof error.response.data.error === 'string' ? 
          error.response.data.error : JSON.stringify(error.response.data.error);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      set({
        loading: false,
        error: errorMessage
      });
      
      toast.error(errorMessage);
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
    
    // Clear the refresh interval
    const currentInterval = get().authInterval;
    if (currentInterval) {
      clearInterval(currentInterval);
    }
    
    set({
      user: null,
      isAuthenticated: false,
      error: null,
      authInterval: null
    });
    toast.success('Logged out successfully');
  },

  // Clear errors
  clearError: () => set({ error: null })
})); 