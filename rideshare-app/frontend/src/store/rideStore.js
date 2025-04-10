import { create } from 'zustand';
import { toast } from 'react-toastify';
import axios from 'axios';

// Check if we're in development mode without backend
const isDevelopmentWithoutBackend = () => {
  return process.env.REACT_APP_NODE_ENV === 'development' && process.env.REACT_APP_USE_BACKEND !== 'true';
};

// Update the API calls to use environment variable for API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configure axios instance with auth interceptor
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'
});

// Add request interceptor to include JWT token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 Unauthorized responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Token expired or invalid - clearing token');
      // Clear invalid token
      localStorage.removeItem('token');
      // Optionally redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generate a unique ID for development mode
const generateId = () => {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const useRideStore = create((set, get) => ({
  rides: [],
  rideOffers: [], // Add ride offers array to store available ride offers
  myOfferedRides: [], // Add array for rides offered by the current user
  myRequestedRides: [], // Add array for rides requested by the current user
  currentRide: null,
  nearbyDrivers: [],
  availableRides: [], // For the FindRide page
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalResults: 0
  },
  loading: false,
  requesting: false, // Specific state for ride requests
  error: null,
  success: null,

  // Helper functions
  setLoading: (state) => set({ loading: state }),
  setError: (message) => set({ error: message }),
  setSuccess: (message) => set({ success: message }),
  clearErrors: () => set({ error: null }),
  
  // Handle API errors
  handleApiError: (error) => {
    console.error('API Error:', error);
    set({
      error: error.response?.data?.message || 'An unexpected error occurred',
      loading: false
    });
  },

  // Get user's ride history
  getUserRides: async () => {
    try {
      set({ loading: true });
      set({ error: null });
      
      // Check for token
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available for getUserRides');
        set({ 
          loading: false, 
          error: 'Authentication required',
          rides: []
        });
        return [];
      }
      
      // Log the headers being sent
      console.log('Sending auth header:', `Bearer ${token.substring(0, 15)}...`);
      
      const response = await api.get('/rides/user-rides');
      
      if (response.data.status === 'success') {
        const rides = response.data.data.rides || [];
        console.log(`Fetched ${rides.length} user rides`);
        
        set({
          rides,
          loading: false,
          error: null
        });
        
        return rides;
      } else {
        throw new Error(response.data.message || 'Failed to fetch rides');
      }
    } catch (error) {
      console.error('Error in getUserRides:', error);
      
      // Check for auth errors
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Clear token on auth errors
        localStorage.removeItem('token');
        set({ 
          loading: false, 
          error: 'Your session has expired. Please log in again.',
          rides: []
        });
        toast.error('Your session has expired. Please log in again.');
      } else {
        set({
          loading: false,
          error: error.response?.data?.message || 'Failed to fetch rides',
          rides: []
        });
        toast.error('Error loading rides. Please try again.');
      }
      return [];
    }
  },

  // Get driver's ride history
  getDriverRides: async () => {
    try {
      set({ loading: true });
      
      const token = localStorage.getItem('token');
      
      const response = await api.get('/rides/driver-rides');

      // Sort rides by requestedAt date (newest first)
      const sortedRides = response.data.data.rides.sort((a, b) => {
        return new Date(b.requestedAt) - new Date(a.requestedAt);
      });

      // Check for any active ride
      const activeRide = sortedRides.find(ride => 
        ['driver_assigned', 'driver_arrived', 'in_progress'].includes(ride.status)
      );
      
      set({
        rides: sortedRides,
        currentRide: activeRide || null,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching driver rides:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch ride history'
      });
    }
  },

  // Get ride by ID
  getRideById: async (rideId) => {
    try {
      set({ loading: true });
      set({ error: null }); // Clear any previous errors
      
      // Development mode simulation
      if (isDevelopmentWithoutBackend()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get all stored rides
        const storedRides = localStorage.getItem('userRides');
        const allRides = storedRides ? JSON.parse(storedRides) : [];
        
        // Check offered rides
        const storedOffers = localStorage.getItem('rideOffers');
        const allOffers = storedOffers ? JSON.parse(storedOffers) : [];
        
        // Try to find the ride in either collection
        const ride = allRides.find(r => r.id === rideId || r._id === rideId) ||
                     allOffers.find(r => r.id === rideId || r._id === rideId);
        
        if (!ride) {
          set({
            loading: false,
            error: 'Ride not found. It may have been removed or you may not have access.'
          });
          return null;
        }
        
        set({
          loading: false,
          error: null
        });
        
        return ride;
      }
      
      const token = localStorage.getItem('token');
      
      try {
        const response = await api.get(`/rides/${rideId}`);
        
        set({
          loading: false,
          error: null
        });
        
        return response.data.data.ride;
      } catch (axiosError) {
        // Check if we should try to find the ride in existing state
        const state = get();
        
        // Try to find the ride in offered or requested rides
        const offeredRide = state.myOfferedRides.find(r => r.id === rideId || r._id === rideId);
        if (offeredRide) {
          set({ loading: false, error: null });
          return offeredRide;
        }
        
        const requestedRide = state.myRequestedRides.find(
          req => (req.ride?.id === rideId || req.ride?._id === rideId) && req.ride
        );
        if (requestedRide) {
          set({ loading: false, error: null });
          return requestedRide.ride;
        }
        
        // If we couldn't find the ride in our state, throw the original error
        throw axiosError;
      }
    } catch (error) {
      console.error('Error fetching ride details:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch ride details. Please try again.'
      });
      toast.error('Failed to fetch ride details. Please try again.');
      return null;
    }
  },

  // Request to join a ride
  requestRide: async (rideId, seats = 1) => {
    try {
      set({ loading: true, error: null });
      
      console.log(`Requesting ride ${rideId} for ${seats} seats`);
      
      // Validate the ride exists
      const state = get();
      const ride = state.rides.find(r => r._id === rideId);
      
      if (!ride) {
        console.error('Ride not found in store:', rideId);
        toast.error('Ride not found. Please refresh and try again.');
        set({ loading: false });
        return;
      }
      
      // Validate seats
      if (!seats || seats < 1 || (ride.availableSeats && seats > ride.availableSeats)) {
        toast.error(`Please request between 1 and ${ride.availableSeats || 1} seats.`);
        set({ loading: false });
        return;
      }
      
      // Check if user has already requested this ride
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userRequested = ride.requests?.some(req => req.passenger?._id === userData?._id);
      
      if (userRequested) {
        toast.info('You have already requested this ride.');
        set({ loading: false });
        return;
      }
      
      // Make the request
      const response = await api.post(`/rides/${rideId}/request`, { seats });
      
      console.log('Ride request response:', response.data);
      
      if (response.data.status === 'success' || response.data.success) {
        // Update the ride in the store
        set(state => {
          const updatedRides = state.rides.map(r => {
            if (r._id === rideId) {
              // Add user's request to the ride
              const newRequest = {
                _id: response.data.requestId || generateId(),
                passenger: { _id: userData?._id, name: userData?.name },
                status: 'PENDING',
                seats,
                createdAt: new Date().toISOString()
              };
              
              return {
                ...r,
                requests: [...(r.requests || []), newRequest],
                availableSeats: r.availableSeats ? Math.max(0, r.availableSeats - seats) : 0
              };
            }
            return r;
          });
          
          // Add to user rides
          return {
            ...state,
            rides: updatedRides,
            userRides: [
              ...state.userRides, 
              {
                ...ride,
                requestStatus: 'PENDING',
                requestSeats: seats,
                requestId: response.data.requestId || generateId()
              }
            ]
          };
        });
        
        toast.success('Ride request sent successfully!');
      } else {
        toast.error('Failed to request ride. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting ride:', error);
      set({ 
        error: 'Failed to request ride: ' + (error.response?.data?.message || error.message),
        loading: false 
      });
      toast.error('Failed to request ride: ' + (error.response?.data?.message || error.message));
    } finally {
      set({ loading: false });
    }
  },

  // Accept a ride (driver)
  acceptRide: async (rideId) => {
    try {
      set({ loading: true });
      
      const token = localStorage.getItem('token');
      
      const response = await api.post('/rides/accept', { rideId });

      const acceptedRide = response.data.data.ride;
      
      set(state => ({
        rides: state.rides.map(ride => 
          ride._id === acceptedRide._id ? acceptedRide : ride
        ),
        currentRide: acceptedRide,
        loading: false,
        error: null
      }));

      toast.success('Ride accepted');
      return acceptedRide;
    } catch (error) {
      console.error('Error accepting ride:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to accept ride'
      });
      toast.error(error.response?.data?.message || 'Failed to accept ride');
      return null;
    }
  },

  // Driver arrived at pickup location
  driverArrived: async (rideId) => {
    try {
      set({ loading: true });
      
      const token = localStorage.getItem('token');
      
      const response = await api.patch(`/rides/${rideId}/driver-arrived`);

      const updatedRide = response.data.data.ride;
      
      set(state => ({
        rides: state.rides.map(ride => 
          ride._id === updatedRide._id ? updatedRide : ride
        ),
        currentRide: updatedRide,
        loading: false,
        error: null
      }));

      toast.success('Arrival confirmed');
      return updatedRide;
    } catch (error) {
      console.error('Error updating arrival status:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to update arrival status'
      });
      toast.error(error.response?.data?.message || 'Failed to update arrival status');
      return null;
    }
  },

  // Start the ride
  startRide: async (rideId) => {
    try {
      set({ loading: true });
      
      const token = localStorage.getItem('token');
      
      const response = await api.patch(`/rides/${rideId}/start`);

      const updatedRide = response.data.data.ride;
      
      set(state => ({
        rides: state.rides.map(ride => 
          ride._id === updatedRide._id ? updatedRide : ride
        ),
        currentRide: updatedRide,
        loading: false,
        error: null
      }));

      toast.success('Ride started');
      return updatedRide;
    } catch (error) {
      console.error('Error starting ride:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to start ride'
      });
      toast.error(error.response?.data?.message || 'Failed to start ride');
      return null;
    }
  },

  // Complete the ride
  completeRide: async (rideId) => {
    try {
      set({ loading: true });
      
      const token = localStorage.getItem('token');
      
      const response = await api.patch(`/rides/${rideId}/complete`);

      const updatedRide = response.data.data.ride;
      
      set(state => ({
        rides: state.rides.map(ride => 
          ride._id === updatedRide._id ? updatedRide : ride
        ),
        currentRide: null,
        loading: false,
        error: null
      }));

      toast.success('Ride completed');
      return updatedRide;
    } catch (error) {
      console.error('Error completing ride:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to complete ride'
      });
      toast.error(error.response?.data?.message || 'Failed to complete ride');
      return null;
    }
  },

  // Cancel the ride
  cancelRide: async (rideId, reason) => {
    try {
      set({ loading: true });
      
      const token = localStorage.getItem('token');
      
      const response = await api.patch(`/rides/${rideId}/cancel`, { reason });

      const updatedRide = response.data.data.ride;
      
      set(state => ({
        rides: state.rides.map(ride => 
          ride._id === updatedRide._id ? updatedRide : ride
        ),
        currentRide: null,
        loading: false,
        error: null
      }));

      toast.success('Ride cancelled');
      return updatedRide;
    } catch (error) {
      console.error('Error cancelling ride:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to cancel ride'
      });
      toast.error(error.response?.data?.message || 'Failed to cancel ride');
      return null;
    }
  },

  // Rate a ride
  rateRide: async (rideId, rating, comment) => {
    try {
      set({ loading: true });
      
      const token = localStorage.getItem('token');
      
      const response = await api.post(`/rides/${rideId}/rate`, { rating, comment });

      const updatedRide = response.data.data.ride;
      
      set(state => ({
        rides: state.rides.map(ride => 
          ride._id === updatedRide._id ? updatedRide : ride
        ),
        loading: false,
        error: null
      }));

      toast.success('Thank you for your rating');
      return updatedRide;
    } catch (error) {
      console.error('Error rating ride:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to submit rating'
      });
      toast.error(error.response?.data?.message || 'Failed to submit rating');
      return null;
    }
  },

  // Get nearby drivers
  getNearbyDrivers: async (longitude, latitude, rideType, radius = 5) => {
    try {
      set({ loading: true });
      
      const response = await api.get('/drivers/nearby', {
        params: {
          longitude,
          latitude,
          rideType,
          radius
        }
      });

      set({
        nearbyDrivers: response.data.data.drivers,
        loading: false,
        error: null
      });

      return response.data.data.drivers;
    } catch (error) {
      console.error('Error finding nearby drivers:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to find nearby drivers'
      });
      return [];
    }
  },

  // Clear current ride
  clearCurrentRide: () => {
    set({ currentRide: null });
  },

  // Create a ride offer (by driver)
  createRideOffer: async (rideData) => {
    try {
      set({ loading: true });
      set({ error: null }); // Clear errors
      
      // Check for a valid token first
      const token = localStorage.getItem('token');
      if (!token) {
        set({ loading: false });
        toast.error('You must be logged in to create ride offers');
        return null;
      }
      
      // Also check for user data as a backup
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData) {
        // If token exists but userData doesn't, try to fix it by refreshing user data
        try {
          const response = await api.get('/auth/me');
          if (response.data && response.data.data && response.data.data.user) {
            // Save the user data to localStorage
            localStorage.setItem('userData', JSON.stringify(response.data.data.user));
          } else {
            set({ loading: false });
            toast.error('Session data is missing. Please log in again.');
            return null;
          }
        } catch (error) {
          set({ loading: false });
          toast.error('Authentication error. Please log in again.');
          // Clear invalid token
          localStorage.removeItem('token');
          return null;
        }
      }
      
      // Log the offer data for debugging
      console.log('Creating ride offer with data:', rideData);
      
      // Format the data for the API correctly
      const rideOfferData = {
        pickup: {
          address: rideData.departureAddress,
          location: {
            type: 'Point',
            coordinates: [
              rideData.departureLocation.lng,
              rideData.departureLocation.lat
            ]
          }
        },
        destination: {
          address: rideData.destinationAddress,
          location: {
            type: 'Point',
            coordinates: [
              rideData.destinationLocation.lng,
              rideData.destinationLocation.lat
            ]
          }
        },
        rideType: 'economy',
        estimatedDistance: rideData.estimatedDistance || 10,
        estimatedDuration: rideData.estimatedDuration || 30,
        paymentMethod: 'credit_card',
        status: 'requested',
        departureCity: rideData.departureCity,
        destinationCity: rideData.destinationCity,
        departureTime: rideData.departureTime,
        availableSeats: parseInt(rideData.availableSeats) || 1,
        fare: {
          estimatedFare: parseFloat(rideData.price).toFixed(2),
          currency: 'INR'
        },
        vehicle: rideData.vehicle || { model: '', color: '', licensePlate: '' },
        phoneNumber: rideData.phoneNumber || (userData ? userData.phoneNumber : ''),
        notes: rideData.notes || ''
      };
      
      // Make the API call
      const response = await api.post('/rides', rideOfferData);
      
      if (response.data.status === 'success') {
        set(state => ({
          ...state,
          rides: [response.data.data.ride, ...state.rides]
        }));
        
        toast.success('Ride offer created successfully');
        return response.data.data.ride;
      } else {
        throw new Error(response.data.message || 'Failed to create ride offer');
      }
    } catch (error) {
      console.error('Error creating ride offer:', error);
      set({
        error: error.response?.data?.message || 'Failed to create ride offer',
        loading: false
      });
      toast.error('Failed to create ride offer');
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  // Get all available ride offers
  getRideOffers: async (filters = {}) => {
    try {
      set({ loading: true });
      set({ error: null });
      
      // Check for token
      const token = localStorage.getItem('token');
      if (!token) {
        set({ 
          loading: false, 
          error: 'Authentication required',
          rideOffers: []
        });
        return [];
      }
      
      console.log('Getting ride offers with filters:', filters);
      
      // Development mode simulation
      if (isDevelopmentWithoutBackend()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get stored offers or create demo offers
        const storedOffers = localStorage.getItem('rideOffers');
        let offers = storedOffers ? JSON.parse(storedOffers) : [];
        
        // If no offers exist, create demo offers
        if (offers.length === 0) {
          offers = [
            {
              id: 'offer-1',
              driverId: 'driver-1',
              driver: {
                name: 'John Doe',
                rating: 4.7,
                vehicle: { model: 'Toyota Camry', color: 'Blue', year: 2020 }
              },
              departure: {
                address: '123 Main St',
                city: 'San Francisco',
                location: { lat: 37.7749, lng: -122.4194 }
              },
              destination: {
                address: '456 Market St',
                city: 'Los Angeles',
                location: { lat: 34.0522, lng: -118.2437 }
              },
              departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
              availableSeats: 3,
              price: 45,
              status: 'active',
              createdAt: new Date().toISOString()
            },
            {
              id: 'offer-2',
              driverId: 'driver-2',
              driver: {
                name: 'Jane Smith',
                rating: 4.9,
                vehicle: { model: 'Honda Accord', color: 'Black', year: 2021 }
              },
              departure: {
                address: '789 Oak St',
                city: 'Seattle',
                location: { lat: 47.6062, lng: -122.3321 }
              },
              destination: {
                address: '101 Pine St',
                city: 'Portland',
                location: { lat: 45.5051, lng: -122.6750 }
              },
              departureTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
              availableSeats: 2,
              price: 35,
              status: 'active',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
            },
            {
              id: 'offer-3',
              driverId: 'driver-3',
              driver: {
                name: 'Mike Johnson',
                rating: 4.5,
                vehicle: { model: 'Tesla Model 3', color: 'White', year: 2022 }
              },
              departure: {
                address: '222 Elm St',
                city: 'New York',
                location: { lat: 40.7128, lng: -74.0060 }
              },
              destination: {
                address: '333 Maple St',
                city: 'Boston',
                location: { lat: 42.3601, lng: -71.0589 }
              },
              departureTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
              availableSeats: 4,
              price: 55,
              status: 'active',
              createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
            }
          ];
          
          // Save demo offers to localStorage
          localStorage.setItem('rideOffers', JSON.stringify(offers));
        }
        
        // Apply filters if any
        let filteredOffers = [...offers];
        
        if (filters.departureCity) {
          filteredOffers = filteredOffers.filter(offer => 
            offer.departure.city.toLowerCase().includes(filters.departureCity.toLowerCase())
          );
        }
        
        if (filters.destinationCity) {
          filteredOffers = filteredOffers.filter(offer => 
            offer.destination.city.toLowerCase().includes(filters.destinationCity.toLowerCase())
          );
        }
        
        if (filters.departureDate) {
          const filterDate = new Date(filters.departureDate);
          filteredOffers = filteredOffers.filter(offer => {
            const offerDate = new Date(offer.departureTime);
            return offerDate.toDateString() === filterDate.toDateString();
          });
        }
        
        // Sort by creation date (newest first)
        filteredOffers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        set({
          rideOffers: filteredOffers,
          loading: false,
          error: null
        });
        
        return filteredOffers;
      }
      
      // Build query params for filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      console.log('Fetching ride offers with params:', queryParams.toString());
      
      try {
        const response = await api.get(`/rides/offers?${queryParams}`);
        
        if (response.data.status === 'success') {
          const rides = response.data.data.rides || [];
          
          console.log(`Fetched ${rides.length} ride offers:`, rides);
          
          // Map received rides to ensure they have an id for frontend
          const processedRides = rides.map(ride => {
            // Create a copy to avoid mutating original
            const rideCopy = {...ride};
            // Ensure id exists (use _id if id is missing)
            if (rideCopy._id && !rideCopy.id) {
              rideCopy.id = rideCopy._id;
            }
            return rideCopy;
          });
          
          set({
            rideOffers: processedRides,
            loading: false,
            error: null
          });
          
          return processedRides;
        } else {
          throw new Error(response.data.message || 'Failed to fetch ride offers');
        }
      } catch (apiError) {
        // Check for 401/403 errors and handle authentication issues
        if (apiError.response && (apiError.response.status === 401 || apiError.response.status === 403)) {
          // Potential token expiration
          localStorage.removeItem('token');
          set({
            loading: false,
            error: 'Your session has expired. Please log in again.',
            rideOffers: []
          });
          toast.error('Your session has expired. Please log in again.');
        } else {
          set({
            loading: false,
            error: apiError.response?.data?.message || 'Failed to fetch ride offers',
            rideOffers: []
          });
        }
        console.error('Error fetching ride offers:', apiError);
        return [];
      }
    } catch (error) {
      console.error('Error in getRideOffers:', error);
      set({
        loading: false,
        error: error.message || 'An unexpected error occurred',
        rideOffers: []
      });
      return [];
    }
  },
  
  // Join a ride (book a seat in a ride offer)
  joinRide: async (offerId) => {
    try {
      set({ loading: true });
      
      // Development mode simulation
      if (isDevelopmentWithoutBackend()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get stored offers
        const storedOffers = localStorage.getItem('rideOffers');
        const offers = storedOffers ? JSON.parse(storedOffers) : [];
        
        // Find the selected offer
        const selectedOffer = offers.find(offer => offer.id === offerId);
        
        if (!selectedOffer) {
          throw new Error('Ride offer not found');
        }
        
        if (selectedOffer.availableSeats <= 0) {
          throw new Error('No available seats');
        }
        
        // Update available seats
        const updatedOffer = {
          ...selectedOffer,
          availableSeats: selectedOffer.availableSeats - 1
        };
        
        // Update offers array
        const updatedOffers = offers.map(offer => 
          offer.id === offerId ? updatedOffer : offer
        );
        
        // Save to localStorage
        localStorage.setItem('rideOffers', JSON.stringify(updatedOffers));
        
        // Create a new ride for the user
        const userData = localStorage.getItem('userData');
        const user = userData ? JSON.parse(userData) : {
          id: 'user-' + Math.random().toString(36).substring(7),
          name: 'Test User'
        };
        
        const newRide = {
          id: 'ride-' + Math.random().toString(36).substring(7),
          userId: user.id,
          offerId: offerId,
          driver: selectedOffer.driver,
          pickup: selectedOffer.departure,
          destination: selectedOffer.destination,
          departureTime: selectedOffer.departureTime,
          fare: selectedOffer.price,
          status: 'confirmed',
          requestedAt: new Date().toISOString()
        };
        
        // Get stored user rides or create empty array
        const storedRides = localStorage.getItem('userRides');
        const userRides = storedRides ? JSON.parse(storedRides) : [];
        
        // Add new ride to user rides
        const updatedUserRides = [newRide, ...userRides];
        
        // Save to localStorage
        localStorage.setItem('userRides', JSON.stringify(updatedUserRides));
        
        set(state => ({
          rides: updatedUserRides,
          currentRide: newRide,
          rideOffers: updatedOffers,
          loading: false,
          error: null
        }));

        toast.success('Ride booked successfully');
        return newRide;
      }
      
      const token = localStorage.getItem('token');
      
      const response = await api.post(`/rides/offers/${offerId}/join`);

      const newRide = response.data.data.ride;
      const updatedOffer = response.data.data.offer;
      
      set(state => ({
        rides: [newRide, ...state.rides],
        currentRide: newRide,
        rideOffers: state.rideOffers.map(offer => 
          offer.id === updatedOffer.id ? updatedOffer : offer
        ),
        loading: false,
        error: null
      }));

      toast.success('Ride booked successfully');
      return newRide;
    } catch (error) {
      console.error('Error booking ride:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to book ride'
      });
      toast.error(error.response?.data?.message || 'Failed to book ride');
      return null;
    }
  },
  
  // Get driver's ride offers
  getDriverOffers: async () => {
    try {
      set({ loading: true });
      
      // Development mode simulation
      if (isDevelopmentWithoutBackend()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get stored offers
        const storedOffers = localStorage.getItem('rideOffers');
        const offers = storedOffers ? JSON.parse(storedOffers) : [];
        
        // Filter to get only the current driver's offers
        const userData = localStorage.getItem('userData');
        const user = userData ? JSON.parse(userData) : { id: 'driver-1' };
        
        const driverOffers = offers.filter(offer => offer.driverId === user.id);
        
        set({
          driverOffers,
          loading: false,
          error: null
        });
        
        return driverOffers;
      }
      
      const response = await api.get('/rides/driver');
      
      if (response.data.status === 'success') {
        set({
          driverOffers: response.data.data.rides,
          loading: false,
          error: null
        });
        
        return response.data.data.rides;
      } else {
        throw new Error(response.data.message || 'Failed to fetch driver offers');
      }
    } catch (error) {
      console.error('Error fetching driver offers:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch driver offers'
      });
      return [];
    }
  },

  // Get user's offered rides
  getMyOfferedRides: async () => {
    try {
      set({ loading: true });
      set({ error: null });
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        set({ 
          loading: false,
          error: 'You must be logged in to view your offered rides',
          myOfferedRides: []
        });
        return [];
      }
      
      // Development mode simulation
      if (isDevelopmentWithoutBackend()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockOfferedRides = [];
        
        set({
          myOfferedRides: mockOfferedRides,
          loading: false
        });
        
        return mockOfferedRides;
      }
      
      // Make API call
      const response = await api.get('/rides/my-offered-rides');
      
      if (response.data.status === 'success') {
        set({
          myOfferedRides: response.data.data.rides,
          loading: false
        });
        
        return response.data.data.rides;
      } else {
        throw new Error(response.data.message || 'Failed to fetch offered rides');
      }
    } catch (error) {
      console.error('Error fetching offered rides:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch offered rides',
        myOfferedRides: []
      });
      return [];
    }
  },
  
  // Get user's requested rides
  getMyRequestedRides: async () => {
    try {
      set({ loading: true });
      set({ error: null });
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        set({ 
          loading: false,
          error: 'You must be logged in to view your requested rides',
          myRequestedRides: []
        });
        return [];
      }
      
      // Development mode simulation
      if (isDevelopmentWithoutBackend()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockRequestedRides = [];
        
        set({
          myRequestedRides: mockRequestedRides,
          loading: false
        });
        
        return mockRequestedRides;
      }
      
      // Make API call
      const response = await api.get('/rides/my-requested-rides');
      
      if (response.data.status === 'success') {
        set({
          myRequestedRides: response.data.data.rides,
          loading: false
        });
        
        return response.data.data.rides;
      } else {
        throw new Error(response.data.message || 'Failed to fetch requested rides');
      }
    } catch (error) {
      console.error('Error fetching requested rides:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch requested rides',
        myRequestedRides: []
      });
      return [];
    }
  },
  
  // Accept a join request for a ride offer
  acceptJoinRequest: async (requestId, ride) => {
    try {
      set({ loading: true });
      set({ error: null }); // Clear errors
      
      // Development mode simulation
      if (isDevelopmentWithoutBackend()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update the ride status
        const updatedRide = {
          ...ride,
          joinRequests: ride.joinRequests.map(req => 
            req.id === requestId 
              ? { ...req, status: 'accepted' } 
              : req
          ),
          availableSeats: ride.availableSeats - 1
        };
        
        // Get current state
        const state = get();
        
        // Update the state with the new ride data
        const updatedOfferedRides = state.myOfferedRides.map(r => 
          r.id === ride.id ? updatedRide : r
        );
        
        // Updated the requested rides as well if this user has also requested rides
        const updatedUserRequests = state.myRequestedRides.map(req => {
          if (req.ride?.id === ride.id) {
            return {
              ...req,
              status: 'accepted',
              ride: {
                ...req.ride,
                driver: {
                  ...req.ride.driver,
                  phoneNumber: '123-456-7890' // Mock phone number
                }
              }
            };
          }
          return req;
        });
        
        set({
          myOfferedRides: updatedOfferedRides,
          myRequestedRides: updatedUserRequests,
          success: 'Join request accepted successfully.',
          loading: false
        });
        
        return true;
      }
      
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('userData')) || {};
      
      const { data } = await api.post(`/rides/join-requests/${requestId}/accept`);
      
      if (data.success) {
        // Update ride with driver contact info
        const updatedRide = {
          ...ride,
          joinRequests: ride.joinRequests.map(req => 
            req.id === requestId 
              ? { ...req, status: 'accepted' } 
              : req
          ),
          availableSeats: ride.availableSeats - 1
        };
        
        // Get current state
        const state = get();
        
        // Update the state with the new ride data
        const updatedOfferedRides = state.myOfferedRides.map(r => 
          r.id === ride.id ? updatedRide : r
        );
        
        // Updated the requested rides as well if this user has also requested rides
        const updatedUserRequests = state.myRequestedRides.map(req => {
          if (req.ride?.id === ride.id) {
            return {
              ...req,
              status: 'accepted',
              ride: {
                ...req.ride,
                driver: {
                  ...req.ride.driver,
                  phoneNumber: userData.phoneNumber || data.user?.phoneNumber
                }
              }
            };
          }
          return req;
        });
        
        set({
          myOfferedRides: updatedOfferedRides,
          myRequestedRides: updatedUserRequests,
          success: 'Join request accepted successfully.',
          loading: false
        });
      } else {
        set({
          error: data.message || 'Failed to accept join request.',
          loading: false
        });
      }
      
      return data.success;
    } catch (error) {
      console.error('API Error:', error);
      set({
        error: error.response?.data?.message || 'An unexpected error occurred',
        loading: false
      });
      toast.error('Failed to accept request. Please try again.');
      return false;
    }
  },
  
  // Cancel a ride request
  cancelRideRequest: async (rideId, requestId) => {
    try {
      set({ loading: true, error: null });
      
      // Make sure we have the ride in our state
      const state = get();
      const ride = state.rides.find(r => r._id === rideId);
      
      if (!ride) {
        console.error('Ride not found:', rideId);
        toast.error('Could not find the ride. Please refresh and try again.');
        set({ loading: false });
        return;
      }
      
      let success = false;
      
      try {
        // First try the specific request cancellation endpoint
        const response = await api.delete(`/rides/requests/${requestId}`);
        console.log('Cancelled request response:', response.data);
        success = true;
      } catch (cancelError) {
        console.error('Error cancelling with request endpoint:', cancelError);
        
        // If that fails, try the ride-specific endpoint
        try {
          const response = await api.delete(`/rides/${rideId}/request`);
          console.log('Cancelled via ride endpoint:', response.data);
          success = true;
        } catch (rideError) {
          console.error('Error cancelling with ride endpoint:', rideError);
          
          // If both API calls fail but we have the ride locally, update the UI
          // to give the user immediate feedback
          if (ride) {
            // Remove the request from the ride locally
            set(state => ({
              ...state,
              rides: state.rides.map(r => {
                if (r._id === rideId) {
                  return {
                    ...r,
                    requests: r.requests?.filter(req => req._id !== requestId) || [],
                    passengerInfo: r.passengerInfo?.filter(p => p.requestId !== requestId) || []
                  };
                }
                return r;
              }),
              userRides: state.userRides.map(r => {
                if (r._id === rideId) {
                  return {
                    ...r,
                    requests: r.requests?.filter(req => req._id !== requestId) || [],
                    passengerInfo: r.passengerInfo?.filter(p => p.requestId !== requestId) || []
                  };
                }
                return r;
              })
            }));
            
            toast.warning('Request cancelled locally. Server update failed.');
            set({ loading: false });
            return;
          }
        }
      }
      
      if (success) {
        // Update the local state to reflect the cancelled request
        set(state => ({
          ...state,
          rides: state.rides.map(r => {
            if (r._id === rideId) {
              return {
                ...r,
                requests: r.requests?.filter(req => req._id !== requestId) || [],
                passengerInfo: r.passengerInfo?.filter(p => p.requestId !== requestId) || []
              };
            }
            return r;
          }),
          userRides: state.userRides.map(r => {
            if (r._id === rideId) {
              return {
                ...r,
                requests: r.requests?.filter(req => req._id !== requestId) || [],
                passengerInfo: r.passengerInfo?.filter(p => p.requestId !== requestId) || []
              };
            }
            return r;
          })
        }));
        
        toast.success('Ride request cancelled successfully!');
      } else {
        toast.error('Failed to cancel ride request. Please try again.');
      }
    } catch (error) {
      console.error('Error in cancelRideRequest:', error);
      set({ 
        error: 'Failed to cancel ride request: ' + (error.response?.data?.message || error.message),
        loading: false 
      });
      toast.error('Failed to cancel ride request: ' + (error.response?.data?.message || error.message));
    } finally {
      set({ loading: false });
    }
  },
  
  // Request to join a ride
  requestToJoinRide: async (rideId, requestData) => {
    try {
      set({ loading: true });
      set({ error: null }); // Clear errors
      
      // Development mode simulation
      if (isDevelopmentWithoutBackend()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const userData = JSON.parse(localStorage.getItem('userData')) || { 
          id: 'user-123', 
          name: 'Test User',
          phoneNumber: '+91 9876543210'
        };
        
        // Get ride offers from localStorage
        const storedOffers = localStorage.getItem('rideOffers');
        const rideOffers = storedOffers ? JSON.parse(storedOffers) : [];
        const targetRide = rideOffers.find(offer => offer.id === rideId);
        
        if (!targetRide) {
          set({
            error: 'Ride not found',
            loading: false
          });
          toast.error('Ride not found');
          return false;
        }
        
        // Create new join request
        const newRequest = {
          id: `req-${Date.now()}`,
          user: {
            id: userData.id,
            name: userData.name,
            phoneNumber: userData.phoneNumber
          },
          ride: targetRide,
          rideId: targetRide.id,
          seatsRequired: requestData.seats || 1,
          message: requestData.message || '',
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        
        // Get current state
        const state = get();
        
        // Update state
        set({
          myRequestedRides: [
            ...state.myRequestedRides,
            newRequest
          ],
          success: 'Join request submitted successfully.',
          loading: false
        });
        
        toast.success('Join request submitted successfully');
        return true;
      }
      
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('userData')) || {};
      
      // Include user contact info
      const joinRequestData = {
        ...requestData,
        phoneNumber: userData.phoneNumber // Include passenger's phone number
      };
      
      const { data } = await api.post(`/rides/${rideId}/join`, joinRequestData);
      
      if (data.success) {
        // Get current state
        const state = get();
        
        // Update the requested rides state
        set({
          myRequestedRides: [
            ...state.myRequestedRides,
            {
              id: data.joinRequest.id,
              ride: data.ride,
              rideId: rideId,
              seatsRequired: joinRequestData.seats || 1,
              status: 'pending',
              user: {
                name: userData.name,
                phoneNumber: userData.phoneNumber
              }
            }
          ],
          success: 'Join request submitted successfully.',
          loading: false
        });
        
        toast.success('Join request submitted successfully');
      } else {
        set({
          error: data.message || 'Failed to submit join request.',
          loading: false
        });
        toast.error(data.message || 'Failed to submit join request');
      }
      
      return data.success;
    } catch (error) {
      console.error('API Error:', error);
      set({
        error: error.response?.data?.message || 'An unexpected error occurred',
        loading: false
      });
      toast.error('Failed to submit request. Please try again.');
      return false;
    }
  },

  // Clear errors
  clearError: () => set({ error: null }),

  // Get my ride offerings as a user
  getMyRideOffers: async () => {
    try {
      set({ loading: true });
      set({ error: null });
      
      // Check for valid token
      const token = localStorage.getItem('token');
      if (!token) {
        set({ 
          loading: false, 
          error: 'Authentication required',
          myOffers: []
        });
        toast.error('Please login to see your ride offers');
        return [];
      }
      
      // Development mode simulation
      if (isDevelopmentWithoutBackend()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get stored offers
        const storedOffers = localStorage.getItem('rideOffers');
        const offers = storedOffers ? JSON.parse(storedOffers) : [];
        
        // Filter to get only the current user's offers
        const userData = localStorage.getItem('userData');
        const user = userData ? JSON.parse(userData) : { id: 'user-1' };
        
        const userOffers = offers.filter(offer => offer.userId === user.id);
        
        set({
          myOffers: userOffers,
          loading: false,
          error: null
        });
        
        return userOffers;
      }
      
      console.log('Fetching user ride offers...');
      const response = await api.get('/rides/offers/my');
      
      if (response.data.status === 'success') {
        const offers = response.data.data.rides || [];
        console.log(`Fetched ${offers.length} user ride offers`);
        
        set({
          myOffers: offers,
          loading: false,
          error: null
        });
        
        return offers;
      } else {
        throw new Error(response.data.message || 'Failed to fetch your ride offers');
      }
    } catch (error) {
      console.error('Error fetching user ride offers:', error);
      
      // Check for authentication errors
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        localStorage.removeItem('token');
        toast.error('Your session has expired. Please log in again.');
      }
      
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch your ride offers',
        myOffers: []
      });
      return [];
    }
  },

  // Create test rides with Indian locations
  createTestRides: async () => {
    try {
      set({ loading: true });
      console.log('Creating test rides with Indian locations...');
      
      // Test ride data with Indian locations
      const testRides = [
        {
          departureAddress: 'Connaught Place, New Delhi',
          departureCity: 'New Delhi',
          departureLocation: { lat: 28.6329, lng: 77.2195 },
          destinationAddress: 'Cyber City, Gurugram',
          destinationCity: 'Gurugram',
          destinationLocation: { lat: 28.4950, lng: 77.0928 },
          departureTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
          availableSeats: 3,
          price: 350,
          vehicle: { model: 'Maruti Suzuki Swift', color: 'White', licensePlate: 'DL01AB1234' },
          phoneNumber: '9876543210',
          notes: 'Daily commute to office'
        },
        {
          departureAddress: 'Andheri, Mumbai',
          departureCity: 'Mumbai', 
          departureLocation: { lat: 19.1136, lng: 72.8697 },
          destinationAddress: 'Bandra, Mumbai',
          destinationCity: 'Mumbai',
          destinationLocation: { lat: 19.0596, lng: 72.8295 },
          departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          availableSeats: 2,
          price: 250,
          vehicle: { model: 'Honda City', color: 'Silver', licensePlate: 'MH02CD5678' },
          phoneNumber: '8765432109',
          notes: 'Weekend trip'
        },
        {
          departureAddress: 'Electronic City, Bangalore',
          departureCity: 'Bangalore',
          departureLocation: { lat: 12.8399, lng: 77.6770 },
          destinationAddress: 'MG Road, Bangalore',
          destinationCity: 'Bangalore',
          destinationLocation: { lat: 12.9747, lng: 77.6080 },
          departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          availableSeats: 4,
          price: 200,
          vehicle: { model: 'Toyota Innova', color: 'Black', licensePlate: 'KA01EF9012' },
          phoneNumber: '7654321098', 
          notes: 'Daily office commute, AC available'
        }
      ];
      
      const createRidePromises = testRides.map(ride => get().createRideOffer(ride));
      await Promise.all(createRidePromises);
      
      toast.success('Test rides created successfully');
      
      // Refresh ride offers
      await get().getRideOffers();
      
      set({ loading: false });
      
      return true;
    } catch (error) {
      console.error('Error creating test rides:', error);
      set({ 
        loading: false,
        error: error.message || 'Failed to create test rides'
      });
      toast.error('Failed to create test rides');
      return false;
    }
  },

  // Add action to get available rides
  getAvailableRides: async (queryParams = {}) => {
    try {
      set({ loading: true, error: null });
      
      // Build query string from the provided parameters
      const queryString = Object.entries(queryParams)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      // Make API request
      const response = await api.get(`/rides/available${queryString ? `?${queryString}` : ''}`);
      
      if (response.data.status === 'success') {
        set({ 
          availableRides: response.data.data.rides,
          pagination: {
            totalPages: response.data.data.totalPages,
            currentPage: response.data.data.currentPage,
            totalResults: response.data.data.results
          },
          loading: false 
        });
        return response.data.data;
      } else {
        throw new Error('Failed to fetch available rides');
      }
    } catch (error) {
      console.error('Error fetching available rides:', error);
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to fetch available rides', 
        loading: false 
      });
      throw error;
    }
  },
})); 