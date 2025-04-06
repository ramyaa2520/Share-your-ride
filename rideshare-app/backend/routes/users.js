const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// User profile management
router.patch('/update-me', userController.updateMe);
router.delete('/delete-me', userController.deleteMe);
router.patch('/update-location', userController.updateLocation);

// Saved addresses
router.post('/saved-addresses', userController.addSavedAddress);
router.delete('/saved-addresses/:addressId', userController.removeSavedAddress);

// Payment methods
router.post('/payment-methods', userController.addPaymentMethod);
router.delete('/payment-methods/:methodId', userController.removePaymentMethod);
router.patch('/payment-methods/:methodId/set-default', userController.setDefaultPaymentMethod);

// Admin only routes
router.use(authController.restrictTo('admin'));
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);

module.exports = router; 