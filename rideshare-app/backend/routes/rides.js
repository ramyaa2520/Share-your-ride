const express = require('express');
const rideController = require('../controllers/rideController');
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes (if any)
router.get('/public/active', rideController.getPublicActiveRides);

// Protected routes
router.use(protect); // All routes below need authentication

// Specific named routes first (before the :rideId route)
router.get('/user-rides', rideController.getUserRides);
router.get('/driver-rides', restrictTo('driver'), rideController.getDriverRides);
router.get('/offers', rideController.getRideOffers);
router.get('/offers/my', rideController.getMyRideOffers);
router.get('/my-offered-rides', rideController.getUserOfferedRides);
router.get('/my-requested-rides', rideController.getUserRequestedRides);

// Ride requests
router.post('/', rideController.requestRide);
router.post('/accept', restrictTo('driver'), rideController.acceptRide);
router.post('/:rideId/request', rideController.requestToJoinRide);
router.delete('/:rideId/request', rideController.cancelRideRequest);
router.delete('/requests/:requestId', rideController.cancelRideRequestById);

// Ride actions
router.patch('/:rideId/driver-arrived', restrictTo('driver'), rideController.driverArrived);
router.patch('/:rideId/start', restrictTo('driver'), rideController.startRide);
router.patch('/:rideId/complete', restrictTo('driver'), rideController.completeRide);
router.patch('/:rideId/cancel', rideController.cancelRide);
router.post('/:rideId/rate', rideController.rateRide);

// Get all rides for the FindRide feature
router.get('/available', rideController.getAllRides);

// Get ride by ID (must be last to avoid conflicts with other routes)
router.get('/:rideId', rideController.getRide);

// User specific ride routes
router.get('/user/driver', restrictTo('driver'), rideController.getMyDriverRides);
router.get('/user/passenger', rideController.getMyPassengerRides);

// Driver response to passenger request
router.patch('/:rideId/requests/:requestId', restrictTo('driver'), rideController.respondToPassengerRequest);

// Search and filter routes
router.get('/search', rideController.searchRides);
router.get('/nearby', rideController.getNearbyRides);

// Ride completion and feedback
router.post('/:rideId/review', rideController.addRideReview);

module.exports = router; 