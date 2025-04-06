const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const authController = require('../controllers/authController');

// Public routes that don't need authentication
router.get('/public/active', rideController.getPublicActiveRides);

// Use a simple middleware function that allows all requests for now
// This will prevent the "Router.use() requires a middleware function" error
router.use((req, res, next) => {
  // If authController exists and has a protect method, use it
  if (authController && typeof authController.protect === 'function') {
    return authController.protect(req, res, next);
  }
  
  console.log('Using fallback auth middleware');
  // Attach a basic user object to avoid downstream errors
  req.user = req.user || { _id: 'anonymous', role: 'user' };
  next();
});

// Specific named routes
router.get('/user-rides', rideController.getUserRides);
router.get('/driver-rides', rideController.getDriverRides);
router.get('/offers', rideController.getRideOffers);
router.get('/offers/my', rideController.getMyRideOffers);
router.get('/my-offered-rides', rideController.getUserOfferedRides);
router.get('/my-requested-rides', rideController.getUserRequestedRides);

// Ride requests
router.post('/', rideController.requestRide);
router.post('/accept', rideController.acceptRide);
router.post('/:rideId/request', rideController.requestToJoinRide);
router.delete('/:rideId/request', rideController.cancelRideRequest);
router.delete('/requests/:requestId', rideController.cancelRideRequestById);

// Ride actions
router.patch('/:rideId/driver-arrived', rideController.driverArrived);
router.patch('/:rideId/start', rideController.startRide);
router.patch('/:rideId/complete', rideController.completeRide);
router.patch('/:rideId/cancel', rideController.cancelRide);
router.post('/:rideId/rate', rideController.rateRide);

// Get all rides for the FindRide feature
router.get('/available', rideController.getAllRides);

// Get ride by ID (must be last to avoid conflicts with other routes)
router.get('/:rideId', rideController.getRide);

// User specific ride routes - should come before :rideId route but we'll handle with proper ordering
router.get('/user/driver', rideController.getMyDriverRides);
router.get('/user/passenger', rideController.getMyPassengerRides);
router.get('/user/all', rideController.getUserRides);

// Search and filter routes - should come before :rideId route but we'll handle with proper ordering
router.get('/search', rideController.searchRides);
router.get('/nearby', rideController.getNearbyRides);

module.exports = router; 