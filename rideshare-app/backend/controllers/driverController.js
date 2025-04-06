const Driver = require('../models/Driver');
const User = require('../models/User');
const Ride = require('../models/Ride');

// Get all drivers (admin only)
exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find();
    
    res.status(200).json({
      status: 'success',
      results: drivers.length,
      data: {
        drivers
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get driver by ID
exports.getDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({
        status: 'fail',
        message: 'Driver not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        driver
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update driver profile
exports.updateDriverProfile = async (req, res) => {
  try {
    // Get the driver
    const driver = await Driver.findOne({ user: req.user._id });
    
    if (!driver) {
      return res.status(404).json({
        status: 'fail',
        message: 'Driver profile not found'
      });
    }
    
    // Update vehicle information if provided
    if (req.body.vehicle) {
      Object.keys(req.body.vehicle).forEach(key => {
        driver.vehicle[key] = req.body.vehicle[key];
      });
    }
    
    // Update bank account info if provided
    if (req.body.bankAccountInfo) {
      Object.keys(req.body.bankAccountInfo).forEach(key => {
        driver.bankAccountInfo[key] = req.body.bankAccountInfo[key];
      });
    }
    
    await driver.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        driver
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Toggle driver availability
exports.toggleAvailability = async (req, res) => {
  try {
    // Get the driver
    const driver = await Driver.findOne({ user: req.user._id });
    
    if (!driver) {
      return res.status(404).json({
        status: 'fail',
        message: 'Driver profile not found'
      });
    }
    
    // Check if driver has an active ride
    if (driver.activeRide) {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot change availability while having an active ride'
      });
    }
    
    // Toggle availability
    driver.isAvailable = !driver.isAvailable;
    await driver.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        isAvailable: driver.isAvailable
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Add vehicle document
exports.addDocument = async (req, res) => {
  try {
    const { type, fileUrl } = req.body;
    
    if (!type || !fileUrl) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide document type and file URL'
      });
    }
    
    // Get the driver
    const driver = await Driver.findOne({ user: req.user._id });
    
    if (!driver) {
      return res.status(404).json({
        status: 'fail',
        message: 'Driver profile not found'
      });
    }
    
    // Add document
    driver.documents.push({
      type,
      fileUrl,
      uploadDate: Date.now(),
      verified: false
    });
    
    await driver.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        documents: driver.documents
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Remove vehicle document
exports.removeDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Get the driver
    const driver = await Driver.findOne({ user: req.user._id });
    
    if (!driver) {
      return res.status(404).json({
        status: 'fail',
        message: 'Driver profile not found'
      });
    }
    
    // Filter out the document to remove
    driver.documents = driver.documents.filter(
      doc => doc._id.toString() !== documentId
    );
    
    await driver.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        documents: driver.documents
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Verify driver document (admin only)
exports.verifyDocument = async (req, res) => {
  try {
    const { driverId, documentId } = req.params;
    
    // Get the driver
    const driver = await Driver.findById(driverId);
    
    if (!driver) {
      return res.status(404).json({
        status: 'fail',
        message: 'Driver not found'
      });
    }
    
    // Find the document
    const document = driver.documents.id(documentId);
    
    if (!document) {
      return res.status(404).json({
        status: 'fail',
        message: 'Document not found'
      });
    }
    
    // Update verification status
    document.verified = true;
    await driver.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        document
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Verify driver license (admin only)
exports.verifyLicense = async (req, res) => {
  try {
    const { driverId } = req.params;
    
    // Get the driver
    const driver = await Driver.findById(driverId);
    
    if (!driver) {
      return res.status(404).json({
        status: 'fail',
        message: 'Driver not found'
      });
    }
    
    // Update verification status
    driver.drivingLicense.verified = true;
    await driver.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        drivingLicense: driver.drivingLicense
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get driver earnings
exports.getEarnings = async (req, res) => {
  try {
    // Get the driver
    const driver = await Driver.findOne({ user: req.user._id });
    
    if (!driver) {
      return res.status(404).json({
        status: 'fail',
        message: 'Driver profile not found'
      });
    }
    
    // Get completed rides for more detailed statistics
    const completedRides = await Ride.find({
      driver: driver._id,
      status: 'completed'
    });
    
    // Process earnings by day (for the chart)
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const dailyEarnings = {};
    
    // Initialize daily earnings for last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      dailyEarnings[dateString] = 0;
    }
    
    // Fill in actual earnings
    completedRides.forEach(ride => {
      if (ride.completedAt && ride.completedAt >= oneWeekAgo) {
        const dateString = ride.completedAt.toISOString().split('T')[0];
        if (dailyEarnings[dateString] !== undefined) {
          dailyEarnings[dateString] += ride.fare.actualFare;
        }
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        earnings: driver.earnings,
        dailyEarnings,
        completedRides: driver.completedRides
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get nearby drivers (for passengers)
exports.getNearbyDrivers = async (req, res) => {
  try {
    const { longitude, latitude, radius = 5, rideType = 'economy' } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide longitude and latitude'
      });
    }
    
    // Convert coordinates to numbers
    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    
    // Find available drivers nearby
    const nearbyDrivers = await Driver.find({
      isAvailable: true,
      'vehicle.vehicleType': rideType,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates
          },
          $maxDistance: parseInt(radius) * 1000 // Convert km to meters
        }
      }
    }).limit(10);
    
    // Return minimal driver information for privacy
    const driverData = nearbyDrivers.map(driver => ({
      id: driver._id,
      name: driver.user.name,
      vehicle: driver.vehicle,
      ratings: driver.ratings,
      location: driver.currentLocation
    }));
    
    res.status(200).json({
      status: 'success',
      results: driverData.length,
      data: {
        drivers: driverData
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
}; 