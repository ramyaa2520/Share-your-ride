const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const User = require('../models/User');

// Calculate fare based on distance and ride type with Indian Rupee pricing
const calculateFare = (distance, rideType) => {
  let baseFare = 50.0; // ₹50 base fare 
  let ratePerKm = 15.0; // ₹15 per km for Economy
  
  switch (rideType) {
    case 'economy':
      baseFare = 50.0;
      ratePerKm = 15.0;
      break;
    case 'comfort':
      baseFare = 80.0;
      ratePerKm = 20.0;
      break;
    case 'premium':
      baseFare = 120.0;
      ratePerKm = 30.0;
      break;
    case 'suv':
      baseFare = 100.0;
      ratePerKm = 25.0;
      break;
    default:
      baseFare = 50.0;
      ratePerKm = 15.0;
  }

  const distanceFare = distance * ratePerKm;
  const timeFare = distance * 2.5; // ₹2.5 per km time charge
  const tax = (baseFare + distanceFare + timeFare) * 0.05; // 5% GST
  
  const totalFare = baseFare + distanceFare + timeFare + tax;
  
  return {
    totalFare: parseFloat(totalFare.toFixed(2)),
    breakdown: {
      baseFare: parseFloat(baseFare.toFixed(2)),
      distanceFare: parseFloat(distanceFare.toFixed(2)),
      timeFare: parseFloat(timeFare.toFixed(2)),
      tax: parseFloat(tax.toFixed(2))
    }
  };
};

// Request a new ride
exports.requestRide = async (req, res) => {
  try {
    const {
      pickup,
      destination,
      rideType = 'economy',
      estimatedDistance,
      estimatedDuration,
      paymentMethod = 'credit_card'
    } = req.body;

    // Calculate fare
    const fareDetails = calculateFare(estimatedDistance, rideType);
    
    // Create ride request
    const newRide = await Ride.create({
      user: req.user._id,
      pickup,
      destination,
      rideType,
      estimatedDistance,
      estimatedDuration,
      fare: {
        estimatedFare: fareDetails.totalFare,
        breakdown: fareDetails.breakdown
      },
      paymentMethod,
      status: 'requested'
    });

    // Find available drivers nearby (within 5km radius)
    const availableDrivers = await Driver.find({
      isAvailable: true,
      'vehicle.vehicleType': rideType,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: pickup.location.coordinates
          },
          $maxDistance: 5000 // 5km in meters
        }
      }
    }).limit(5);

    // Update ride status to searching for driver
    newRide.status = 'searching_driver';
    await newRide.save();

    res.status(201).json({
      status: 'success',
      data: {
        ride: newRide,
        availableDrivers: availableDrivers.length
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Accept a ride (for drivers)
exports.acceptRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    
    // Get driver information
    const driver = await Driver.findOne({ user: req.user._id });
    
    if (!driver) {
      return res.status(403).json({
        status: 'fail',
        message: 'You need to be a driver to accept rides'
      });
    }
    
    // Check if driver is available
    if (!driver.isAvailable) {
      return res.status(400).json({
        status: 'fail',
        message: 'You are not available to accept rides'
      });
    }
    
    // Get the ride
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride not found'
      });
    }
    
    // Check ride status
    if (ride.status !== 'requested' && ride.status !== 'searching_driver') {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot accept ride with status: ${ride.status}`
      });
    }
    
    // Assign driver to ride
    ride.driver = driver._id;
    ride.status = 'driver_assigned';
    await ride.save();
    
    // Update driver status
    driver.isAvailable = false;
    driver.activeRide = ride._id;
    await driver.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        ride
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Driver arrives at pickup location
exports.driverArrived = async (req, res) => {
  try {
    const { rideId } = req.params;
    
    // Get driver information
    const driver = await Driver.findOne({ user: req.user._id });
    
    if (!driver) {
      return res.status(403).json({
        status: 'fail',
        message: 'You need to be a driver to update rides'
      });
    }
    
    // Get the ride
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride not found'
      });
    }
    
    // Check if this driver is assigned to this ride
    if (ride.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not assigned to this ride'
      });
    }
    
    // Update ride status
    ride.status = 'driver_arrived';
    await ride.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        ride
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Start ride
exports.startRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    
    // Get driver information
    const driver = await Driver.findOne({ user: req.user._id });
    
    if (!driver) {
      return res.status(403).json({
        status: 'fail',
        message: 'You need to be a driver to update rides'
      });
    }
    
    // Get the ride
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride not found'
      });
    }
    
    // Check if this driver is assigned to this ride
    if (ride.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not assigned to this ride'
      });
    }
    
    // Check if driver has arrived
    if (ride.status !== 'driver_arrived') {
      return res.status(400).json({
        status: 'fail',
        message: 'Driver must be at pickup location to start ride'
      });
    }
    
    // Update ride status
    ride.status = 'in_progress';
    ride.startedAt = new Date();
    await ride.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        ride
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Complete ride
exports.completeRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    
    // Get driver information
    const driver = await Driver.findOne({ user: req.user._id });
    
    if (!driver) {
      return res.status(403).json({
        status: 'fail',
        message: 'You need to be a driver to update rides'
      });
    }
    
    // Get the ride
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride not found'
      });
    }
    
    // Check if this driver is assigned to this ride
    if (ride.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not assigned to this ride'
      });
    }
    
    // Check ride is in progress
    if (ride.status !== 'in_progress') {
      return res.status(400).json({
        status: 'fail',
        message: 'Ride must be in progress to complete'
      });
    }
    
    // Update ride status
    ride.status = 'completed';
    ride.completedAt = new Date();
    
    // Calculate actual fare (could be adjusted based on actual route, time, etc.)
    ride.fare.actualFare = ride.fare.estimatedFare;
    ride.paymentStatus = 'completed';
    
    await ride.save();
    
    // Update driver status
    driver.isAvailable = true;
    driver.activeRide = null;
    driver.completedRides += 1;
    driver.earnings.total += ride.fare.actualFare;
    driver.earnings.currentWeek += ride.fare.actualFare;
    driver.earnings.currentMonth += ride.fare.actualFare;
    
    await driver.save();
    
    // Add ride to user's rides
    const user = await User.findById(ride.user);
    if (!user.rides.includes(ride._id)) {
      user.rides.push(ride._id);
      await user.save({ validateBeforeSave: false });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        ride
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Cancel ride
exports.cancelRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { reason } = req.body;
    
    // Get the ride
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride not found'
      });
    }
    
    // Check if user is authorized to cancel (either the rider or the driver)
    const isRider = ride.user.toString() === req.user._id.toString();
    
    let isDriver = false;
    if (ride.driver) {
      const driver = await Driver.findOne({ user: req.user._id });
      isDriver = driver && ride.driver.toString() === driver._id.toString();
    }
    
    if (!isRider && !isDriver) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to cancel this ride'
      });
    }
    
    // Check if ride can be cancelled
    if (ride.status === 'completed' || ride.status === 'cancelled') {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot cancel ride with status: ${ride.status}`
      });
    }
    
    // Update ride status
    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    ride.cancellationReason = reason || 'No reason provided';
    ride.cancelledBy = isRider ? 'user' : 'driver';
    
    await ride.save();
    
    // If a driver was assigned, make them available again
    if (ride.driver) {
      const driver = await Driver.findById(ride.driver);
      if (driver) {
        driver.isAvailable = true;
        driver.activeRide = null;
        await driver.save();
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        ride
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Rate a ride
exports.rateRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { rating, comment, ratedBy } = req.body;
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'fail',
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Get the ride
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride not found'
      });
    }
    
    // Check if ride is completed
    if (ride.status !== 'completed') {
      return res.status(400).json({
        status: 'fail',
        message: 'Only completed rides can be rated'
      });
    }
    
    // Check if user is authorized to rate
    const isRider = ride.user.toString() === req.user._id.toString();
    
    let isDriver = false;
    if (ride.driver) {
      const driver = await Driver.findOne({ user: req.user._id });
      isDriver = driver && ride.driver.toString() === driver._id.toString();
    }
    
    if (!isRider && !isDriver) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to rate this ride'
      });
    }
    
    // Update the rating
    if (ratedBy === 'user' && isRider) {
      // Passenger rating the driver
      ride.ratings.userToDriver = {
        rating,
        comment: comment || ''
      };
      
      // Update driver's rating
      if (ride.driver) {
        const driver = await Driver.findById(ride.driver);
        const newCount = driver.ratings.count + 1;
        const newAverage = (driver.ratings.average * driver.ratings.count + rating) / newCount;
        
        driver.ratings.count = newCount;
        driver.ratings.average = parseFloat(newAverage.toFixed(1));
        
        await driver.save();
      }
    } else if (ratedBy === 'driver' && isDriver) {
      // Driver rating the passenger
      ride.ratings.driverToUser = {
        rating,
        comment: comment || ''
      };
      
      // Update user's rating
      const user = await User.findById(ride.user);
      const newCount = user.ratings.count + 1;
      const newAverage = (user.ratings.average * user.ratings.count + rating) / newCount;
      
      user.ratings.count = newCount;
      user.ratings.average = parseFloat(newAverage.toFixed(1));
      
      await user.save({ validateBeforeSave: false });
    } else {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid rating configuration'
      });
    }
    
    await ride.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        ride
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get user's rides
exports.getUserRides = async (req, res) => {
  try {
    const rides = await Ride.find({ user: req.user._id }).sort({ requestedAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: rides.length,
      data: {
        rides
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get driver's rides
exports.getDriverRides = async (req, res) => {
  try {
    // Get driver information
    const driver = await Driver.findOne({ user: req.user._id });
    
    if (!driver) {
      return res.status(403).json({
        status: 'fail',
        message: 'You need to be a driver to view driver rides'
      });
    }
    
    const rides = await Ride.find({ driver: driver._id }).sort({ requestedAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: rides.length,
      data: {
        rides
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get a single ride
exports.getRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride not found'
      });
    }
    
    // Check if user is authorized to view the ride
    const isRider = ride.user.toString() === req.user._id.toString();
    
    let isDriver = false;
    if (ride.driver) {
      const driver = await Driver.findOne({ user: req.user._id });
      isDriver = driver && ride.driver.toString() === driver._id.toString();
    }
    
    const isAdmin = req.user.role === 'admin';
    
    if (!isRider && !isDriver && !isAdmin) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view this ride'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        ride
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
}; 