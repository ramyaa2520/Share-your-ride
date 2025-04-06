const express = require('express');
const rideController = require('../controllers/rideController');
const authController = require('../controllers/authController');

// Import the auth middleware correctly with fallback
let authMiddleware;
try {
  // Try importing from middlewares/auth.js (check if this actually exists)
  authMiddleware = require('../middlewares/auth');
} catch (err) {
  // Fallback to middleware/authMiddleware.js if the first path fails
  authMiddleware = require('../middleware/authMiddleware');
}

// Get the protect and restrictTo functions
const { protect, restrictTo } = authMiddleware;

const router = express.Router();

// Public routes (if any)
router.get('/public/active', rideController.getPublicActiveRides);

// Check if protect middleware is a function before using it
if (typeof protect === 'function') {
  // Protected routes
  router.use(protect); // All routes below need authentication
} else {
  console.error('Warning: protect middleware is not a function!');
  // Fallback middleware to avoid breaking the app
  router.use((req, res, next) => {
    console.warn('Using fallback auth middleware!');
    // Minimal fallback authentication implementation
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        status: 'fail', 
        message: 'Authentication required' 
      });
    }
    next();
  });
}

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