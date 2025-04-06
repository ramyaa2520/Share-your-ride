const express = require('express');
const rideController = require('../controllers/rideController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes
router.use(authController.protect);

// Specific named routes first (before the :rideId route)
router.get('/user-rides', rideController.getUserRides);
router.get('/driver-rides', authController.restrictTo('driver'), rideController.getDriverRides);
router.get('/offers', rideController.getRideOffers);
router.get('/my-offered-rides', rideController.getUserOfferedRides);
router.get('/my-requested-rides', rideController.getUserRequestedRides);

// Ride requests
router.post('/', rideController.requestRide);
router.post('/accept', authController.restrictTo('driver'), rideController.acceptRide);

// Ride actions
router.patch('/:rideId/driver-arrived', authController.restrictTo('driver'), rideController.driverArrived);
router.patch('/:rideId/start', authController.restrictTo('driver'), rideController.startRide);
router.patch('/:rideId/complete', authController.restrictTo('driver'), rideController.completeRide);
router.patch('/:rideId/cancel', rideController.cancelRide);
router.post('/:rideId/rate', rideController.rateRide);

// Get ride by ID (must be last to avoid conflicts with other routes)
router.get('/:rideId', rideController.getRide);

module.exports = router; 