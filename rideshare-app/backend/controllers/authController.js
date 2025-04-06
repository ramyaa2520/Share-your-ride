const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');

// Secret key for JWT (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'mysecret-rideshare-key-should-be-env-var';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '90d';

// Create and send JWT token
const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

// Send token response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// User registration
exports.signup = async (req, res) => {
  try {
    console.log('Signup attempt with data:', JSON.stringify(req.body));
    
    // Extract fields from request
    const { name, email, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({
        status: 'fail',
        message: 'Name, email, and password are required'
      });
    }
    
    if (password.length < 8) {
      console.log('Password too short');
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Normalize the email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Processing registration for email:', normalizedEmail);
    
    try {
      // SIMPLIFIED: Just try to create the user directly and handle any duplicate key errors
      // This relies on MongoDB's built-in uniqueness constraint
      console.log('Creating new user with email:', normalizedEmail);
      
      // Create a new user directly
      const newUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: password // Will be hashed by the model's pre-save hook
      });
      
      console.log('User created successfully with ID:', newUser._id);

      // Create a token for the newly registered user
      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || JWT_EXPIRES_IN,
      });

      // Remove password from output
      newUser.password = undefined;

      // Send the successful response
      res.status(201).json({
        status: 'success',
        token,
        data: {
          user: newUser,
        },
      });
    } catch (dbError) {
      console.error('Database operation error details:', {
        name: dbError.name,
        code: dbError.code,
        message: dbError.message,
        keyValue: dbError.keyValue
      });
      
      // Handle validation errors
      if (dbError.name === 'ValidationError') {
        const messages = Object.values(dbError.errors).map(val => val.message);
        return res.status(400).json({
          status: 'fail',
          message: messages.join(', ')
        });
      }
      
      // Handle duplicate email error (MongoDB error code 11000)
      if (dbError.code === 11000) {
        console.error('Duplicate key error detected, keyValue:', dbError.keyValue);
        return res.status(400).json({
          status: 'fail',
          message: 'Email is already registered. Please use a different email or login instead.'
        });
      }
      
      // For other database errors, throw to be caught by outer catch
      throw dbError;
    }
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error creating user account. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Driver registration (requires a user account first)
exports.driverSignup = async (req, res) => {
  try {
    const {
      userId,
      drivingLicense,
      vehicle
    } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // Update user role to driver
    user.role = 'driver';
    await user.save({ validateBeforeSave: false });

    // Create driver profile
    const newDriver = await Driver.create({
      user: userId,
      drivingLicense,
      vehicle
    });

    res.status(201).json({
      status: 'success',
      data: {
        driver: newDriver
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// User login
exports.login = async (req, res) => {
  try {
    console.log('Login attempt with data:', JSON.stringify(req.body));
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user by email with password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    console.log('User lookup result:', user ? 'Found' : 'Not found');

    // Check if user exists & password is correct
    if (!user || !(await user.correctPassword(password, user.password))) {
      console.log('Invalid login credentials');
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }

    // Check if the user is a driver and populate driver information
    let driverInfo = null;
    if (user.role === 'driver') {
      driverInfo = await Driver.findOne({ user: user._id });
    }

    // Create JWT token
    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    // Create user data object to be returned
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profilePicture: user.profilePicture,
      driver: driverInfo
    };

    // Send token and user data
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: userData
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(400).json({
      status: 'fail',
      message: 'An error occurred during login. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Middleware to protect routes (require authentication)
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required. Please log in to access this resource.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token verified successfully for user:', decoded.id);
    } catch (verifyError) {
      console.log('Token verification failed:', verifyError.name);
      if (verifyError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: 'fail',
          message: 'Invalid token. Please log in again.'
        });
      }
      if (verifyError.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'fail', 
          message: 'Your session has expired. Please log in again.'
        });
      }
      throw verifyError;
    }

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      console.log('User no longer exists:', decoded.id);
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Grant access to protected route
    req.user = currentUser;
    console.log('Access granted to protected route for user:', currentUser._id);
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({
      status: 'fail',
      message: 'Authentication failed. Please try logging in again.'
    });
  }
};

// Restrict access to certain user roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Get current user information
exports.getMe = async (req, res) => {
  try {
    // Find current user
    const user = await User.findById(req.user.id);

    // Check if the user is a driver and get driver information
    let driverInfo = null;
    if (user.role === 'driver') {
      driverInfo = await Driver.findOne({ user: user._id });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        driverInfo
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check if current password is correct
    if (!(await user.correctPassword(currentPassword, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Your current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log in user with new password (send new token)
    createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
}; 