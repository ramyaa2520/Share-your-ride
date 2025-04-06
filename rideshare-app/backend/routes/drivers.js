const express = require('express');
const driverController = require('../controllers/driverController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public route to get nearby drivers
router.get('/nearby', driverController.getNearbyDrivers);

// Protect all routes after this middleware
router.use(authController.protect);

// Driver profile routes (driver only)
router.use(authController.restrictTo('driver', 'admin'));
router.patch('/profile', driverController.updateDriverProfile);
router.patch('/availability', driverController.toggleAvailability);
router.post('/documents', driverController.addDocument);
router.delete('/documents/:documentId', driverController.removeDocument);
router.get('/earnings', driverController.getEarnings);

// Admin only routes
router.use(authController.restrictTo('admin'));
router.get('/', driverController.getAllDrivers);
router.get('/:id', driverController.getDriver);
router.patch('/:driverId/documents/:documentId/verify', driverController.verifyDocument);
router.patch('/:driverId/license/verify', driverController.verifyLicense);

module.exports = router; 