const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Authentication routes
router.post('/signup', authController.signup);
router.post('/driver-signup', authController.protect, authController.driverSignup);
router.post('/login', authController.login);

// Password management
router.patch('/update-password', authController.protect, authController.updatePassword);

// User info
router.get('/me', authController.protect, authController.getMe);

module.exports = router; 