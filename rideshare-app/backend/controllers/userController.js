const User = require('../models/User');
const Driver = require('../models/Driver');

// Filter out unwanted fields from req.body
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get user profile
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
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

// Update user profile
exports.updateMe = async (req, res) => {
  try {
    // Check if user is trying to update password
    if (req.body.password) {
      return res.status(400).json({
        status: 'fail',
        message: 'This route is not for password updates. Please use /updatePassword.'
      });
    }
    
    // Filter out unwanted fields
    const filteredBody = filterObj(
      req.body,
      'name',
      'email',
      'phoneNumber',
      'profilePicture',
      'location'
    );
    
    // Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Deactivate user account
exports.deleteMe = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Add a saved address
exports.addSavedAddress = async (req, res) => {
  try {
    const { name, address, location } = req.body;
    
    if (!name || !address || !location) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, address, and location coordinates'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    user.savedAddresses.push({
      name,
      address,
      location
    });
    
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
      status: 'success',
      data: {
        savedAddresses: user.savedAddresses
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Remove a saved address
exports.removeSavedAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    const user = await User.findById(req.user.id);
    
    // Filter out the address to remove
    user.savedAddresses = user.savedAddresses.filter(
      address => address._id.toString() !== addressId
    );
    
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
      status: 'success',
      data: {
        savedAddresses: user.savedAddresses
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Add a payment method
exports.addPaymentMethod = async (req, res) => {
  try {
    const {
      type,
      cardNumber,
      expiryDate,
      cvv,
      isDefault = false
    } = req.body;
    
    if (!type || !cardNumber || !expiryDate || !cvv) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide all payment method details'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    // If this payment method is set as default, remove default from other methods
    if (isDefault) {
      user.paymentMethods.forEach(method => {
        method.isDefault = false;
      });
    }
    
    user.paymentMethods.push({
      type,
      cardNumber,
      expiryDate,
      cvv,
      isDefault
    });
    
    await user.save({ validateBeforeSave: false });
    
    // Don't return sensitive card details
    const paymentMethods = user.paymentMethods.map(method => ({
      _id: method._id,
      type: method.type,
      cardNumber: `**** **** **** ${method.cardNumber.slice(-4)}`,
      expiryDate: method.expiryDate,
      isDefault: method.isDefault
    }));
    
    res.status(200).json({
      status: 'success',
      data: {
        paymentMethods
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Remove a payment method
exports.removePaymentMethod = async (req, res) => {
  try {
    const { methodId } = req.params;
    
    const user = await User.findById(req.user.id);
    
    // Check if the payment method exists
    const methodIndex = user.paymentMethods.findIndex(
      method => method._id.toString() === methodId
    );
    
    if (methodIndex === -1) {
      return res.status(404).json({
        status: 'fail',
        message: 'Payment method not found'
      });
    }
    
    // Check if this is the default payment method
    const isDefault = user.paymentMethods[methodIndex].isDefault;
    
    // Remove the payment method
    user.paymentMethods.splice(methodIndex, 1);
    
    // If removed method was default and other methods exist, set a new default
    if (isDefault && user.paymentMethods.length > 0) {
      user.paymentMethods[0].isDefault = true;
    }
    
    await user.save({ validateBeforeSave: false });
    
    // Don't return sensitive card details
    const paymentMethods = user.paymentMethods.map(method => ({
      _id: method._id,
      type: method.type,
      cardNumber: `**** **** **** ${method.cardNumber.slice(-4)}`,
      expiryDate: method.expiryDate,
      isDefault: method.isDefault
    }));
    
    res.status(200).json({
      status: 'success',
      data: {
        paymentMethods
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Set a payment method as default
exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    const { methodId } = req.params;
    
    const user = await User.findById(req.user.id);
    
    // Set all payment methods as not default
    user.paymentMethods.forEach(method => {
      if (method._id.toString() === methodId) {
        method.isDefault = true;
      } else {
        method.isDefault = false;
      }
    });
    
    await user.save({ validateBeforeSave: false });
    
    // Don't return sensitive card details
    const paymentMethods = user.paymentMethods.map(method => ({
      _id: method._id,
      type: method.type,
      cardNumber: `**** **** **** ${method.cardNumber.slice(-4)}`,
      expiryDate: method.expiryDate,
      isDefault: method.isDefault
    }));
    
    res.status(200).json({
      status: 'success',
      data: {
        paymentMethods
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update user location
exports.updateLocation = async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide valid coordinates [longitude, latitude]'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        location: {
          type: 'Point',
          coordinates
        }
      },
      {
        new: true,
        runValidators: true
      }
    );
    
    // If user is a driver, update driver location as well
    if (user.role === 'driver') {
      await Driver.findOneAndUpdate(
        { user: user._id },
        {
          currentLocation: {
            type: 'Point',
            coordinates
          }
        }
      );
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        location: user.location
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
}; 