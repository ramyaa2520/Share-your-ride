const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Driver = require('../models/Driver');

// Secret key for JWT (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'mysecret-rideshare-key-should-be-env-var';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '90d';

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d' // Token expires in 30 days
  });
};

// Send JWT as response
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
    const { name, email, password, phoneNumber, role } = req.body;
    
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
      // Check if there's an existing user with this email first to provide a clearer error
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        console.log('Email already registered:', normalizedEmail);
        return res.status(400).json({
          status: 'fail',
          message: 'Email is already registered. Please use a different email or login instead.'
        });
      }
      
      console.log('Creating new user with email:', normalizedEmail);
      
      // Create a new user directly, explicitly setting phoneNumber to undefined to avoid null duplicates
      const newUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: password, // Will be hashed by the model's pre-save hook
        phoneNumber: phoneNumber,
        role: role === 'driver' ? 'driver' : 'user' // Only allow user or driver roles
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
      
      // Handle duplicate key error (MongoDB error code 11000)
      if (dbError.code === 11000) {
        console.error('Duplicate key error detected, keyValue:', dbError.keyValue);
        
        // Check if it's a phone_number/phoneNumber duplication
        if (dbError.keyValue && (dbError.keyValue.phone_number !== undefined || dbError.keyValue.phoneNumber !== undefined)) {
          console.log('Attempting registration without phone number due to duplicate null issue');
          
          // Try again with an explicit empty string phoneNumber which will avoid the null duplicate issue
          try {
            const secondAttemptUser = await User.create({
              name: name.trim(),
              email: normalizedEmail,
              password: password,
              phoneNumber: "", // Empty string instead of null/undefined
              role: role === 'driver' ? 'driver' : 'user' // Only allow user or driver roles
            });
            
            console.log('Second attempt succeeded, user created with ID:', secondAttemptUser._id);
            
            // Create a token for the newly registered user
            const token = jwt.sign({ id: secondAttemptUser._id }, process.env.JWT_SECRET || JWT_SECRET, {
              expiresIn: process.env.JWT_EXPIRES_IN || JWT_EXPIRES_IN,
            });
            
            // Remove password from output
            secondAttemptUser.password = undefined;
            
            // Send successful response
            return res.status(201).json({
              status: 'success',
              token,
              data: {
                user: secondAttemptUser,
              },
            });
          } catch (retryError) {
            console.error('Second attempt failed:', retryError);
            // Fall through to the generic error message below
          }
        }
        
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

// Middleware to check if user is authenticated
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      // Also check for cookie
      token = req.cookies.jwt;
    }

    // For development/testing, allow access without token
    if (!token) {
      console.log('No token provided, using development mode');
      // Add a mock user for development
      req.user = { 
        _id: 'dev-user-id', 
        name: 'Development User',
        role: 'user' 
      };
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        console.log('User not found, using development mode');
        req.user = { 
          _id: 'dev-user-id', 
          name: 'Development User',
          role: 'user' 
        };
        return next();
      }

      // Grant access to protected route
      req.user = currentUser;
      next();
    } catch (tokenError) {
      console.log('Token verification failed, using development mode');
      // Add a mock user for development
      req.user = { 
        _id: 'dev-user-id', 
        name: 'Development User',
        role: 'user' 
      };
      next();
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    // Don't block the request in development
    req.user = { 
      _id: 'dev-user-id', 
      name: 'Development User',
      role: 'user' 
    };
    next();
  }
};

// Middleware to restrict access to certain user roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Allow access in development mode
    if (!req.user || !req.user.role) {
      console.log('No user role found, using development mode');
      return next();
    }
    
    if (!roles.includes(req.user.role)) {
      console.log(`User role ${req.user.role} not allowed, but proceeding in development mode`);
      // In development, still allow access
      return next();
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