const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const User = require('../models/User');
const RideRequest = require('../models/RideRequest');
const Notification = require('../models/Notification');

// Calculate fare based on distance and ride type with Indian Rupee pricing
const calculateFare = (distance, rideType, seats = 1) => {
  // Base fare is calculated per seat
  let baseFarePerSeat = 226.0; // ₹226 base fare per seat
  let ratePerKm = 15.0; // ₹15 per km for Economy
  
  switch (rideType) {
    case 'economy':
      ratePerKm = 15.0;
      break;
    case 'comfort':
      ratePerKm = 20.0;
      break;
    case 'premium':
      ratePerKm = 30.0;
      break;
    case 'suv':
      ratePerKm = 25.0;
      break;
    default:
      ratePerKm = 15.0;
  }

  // Calculate base fare (226rs per seat)
  const baseFare = baseFarePerSeat * seats;
  
  // Calculate distance fare (per km, not affected by number of seats)
  const distanceFare = distance * ratePerKm;
  
  // Time fare (per km, not affected by number of seats)
  const timeFare = distance * 2.5; // ₹2.5 per km time charge
  
  // Tax on total
  const tax = (baseFare + distanceFare + timeFare) * 0.1; // 10% tax
  
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
      paymentMethod = 'credit_card',
      seats = 1
    } = req.body;

    // Calculate fare with seats
    const fareDetails = calculateFare(estimatedDistance, rideType, seats);
    
    // Create ride request
    const newRide = await Ride.create({
      user: req.user._id,
      pickup,
      destination,
      rideType,
      estimatedDistance,
      estimatedDuration,
      seats,
      fare: {
        estimatedFare: fareDetails.totalFare,
        breakdown: fareDetails.breakdown,
        currency: 'INR'
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
    console.log('Fetching rides for user:', req.user._id);
    
    const rides = await Ride.find({ user: req.user._id }).sort({ requestedAt: -1 });
    
    console.log(`Found ${rides.length} rides for user ${req.user._id}`);
    
    // Add ID field for frontend compatibility
    const processedRides = rides.map(ride => {
      const rideObj = ride.toObject();
      if (rideObj._id && !rideObj.id) {
        rideObj.id = rideObj._id.toString();
      }
      return rideObj;
    });
    
    res.status(200).json({
      status: 'success',
      results: processedRides.length,
      data: {
        rides: processedRides
      }
    });
  } catch (error) {
    console.error('Error getting user rides:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving rides',
      error: error.message
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

// Get available ride offers
exports.getRideOffers = async (req, res) => {
  try {
    console.log('Fetching ride offers with request query:', req.query);
    
    // Build the query - default to getting all rides with open status
    let query = {
      status: 'open'
    };
    
    // Instead of filtering by departure time, get all rides for demo purposes
    // This ensures all rides are visible for testing
    
    // Apply filters if provided
    if (req.query.departureLat && req.query.departureLng) {
      query['departure.location'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(req.query.departureLng), parseFloat(req.query.departureLat)]
          },
          $maxDistance: parseInt(req.query.departureRadius || 30) * 1000 // Convert km to meters
        }
      };
    }
    
    if (req.query.destinationLat && req.query.destinationLng) {
      query['destination.location'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(req.query.destinationLng), parseFloat(req.query.destinationLat)]
          },
          $maxDistance: parseInt(req.query.destinationRadius || 30) * 1000 // Convert km to meters
        }
      };
    }
    
    if (req.query.departureDate) {
      const date = new Date(req.query.departureDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.departureTime = {
        $gte: date,
        $lt: nextDay
      };
    }
    
    if (req.query.minSeats) {
      query.availableSeats = { $gte: parseInt(req.query.minSeats) };
    }
    
    if (req.query.maxPrice) {
      query['fare.estimatedFare'] = { $lte: parseFloat(req.query.maxPrice) };
    }
    
    console.log('Finding rides with query:', JSON.stringify(query));
    
    // Get all rides, sort by departure time (soonest first), limit to 50 for performance
    const rides = await Ride.find(query)
      .sort({ departureTime: 1 })
      .limit(50)
      .populate('driver', 'name profilePhoto rating')
      .populate('user', 'name profilePhoto');
    
    console.log(`Found ${rides.length} rides matching criteria`);
    
    // Add ride ID for frontend if _id exists but id doesn't
    const processedRides = rides.map(ride => {
      const rideObj = ride.toObject();
      if (rideObj._id && !rideObj.id) {
        rideObj.id = rideObj._id.toString();
      }
      return rideObj;
    });
    
    return res.status(200).json({
      status: 'success',
      results: processedRides.length,
      data: {
        rides: processedRides
      }
    });
  } catch (error) {
    console.error('Error getting ride offers:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get ride offers',
      error: error.message
    });
  }
};

// Get user's offered rides
exports.getUserOfferedRides = async (req, res) => {
  try {
    // Get all rides where the user is either the user field (as offering rides)
    const rides = await Ride.find({
      user: req.user._id,
      status: { $in: ['requested', 'driver_assigned', 'driver_arrived', 'in_progress'] }
    }).sort({ requestedAt: -1 });
    
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

// Get user's requested rides (rides they've joined or requested to join)
exports.getUserRequestedRides = async (req, res) => {
  try {
    // Get driver information for the user (if they are a driver)
    const driver = await Driver.findOne({ user: req.user._id });
    
    // Find rides where the user is the driver
    let driverRides = [];
    if (driver) {
      driverRides = await Ride.find({ 
        driver: driver._id,
        status: { $in: ['driver_assigned', 'driver_arrived', 'in_progress'] }
      }).sort({ requestedAt: -1 });
    }
    
    res.status(200).json({
      status: 'success',
      results: driverRides.length,
      data: {
        rides: driverRides
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get user's own ride offers
exports.getMyRideOffers = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'You must be logged in to view your ride offers'
      });
    }
    
    console.log(`Fetching ride offers for user: ${req.user._id}`);
    
    // Find all rides where the user is the driver (created the ride)
    const rides = await Ride.find({ 
      driver: req.user._id 
    })
    .sort({ departureTime: -1 }) // Sort by departure time, most recent first
    .populate('driver', 'name profilePhoto rating')
    .populate('user', 'name profilePhoto');
    
    console.log(`Found ${rides.length} ride offers for user ${req.user._id}`);
    
    // Add ID field for frontend compatibility
    const processedRides = rides.map(ride => {
      const rideObj = ride.toObject();
      if (rideObj._id && !rideObj.id) {
        rideObj.id = rideObj._id.toString();
      }
      return rideObj;
    });
    
    return res.status(200).json({
      status: 'success',
      results: processedRides.length,
      data: {
        rides: processedRides
      }
    });
  } catch (error) {
    console.error('Error getting user ride offers:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get your ride offers',
      error: error.message
    });
  }
};

// Get all available rides with search and pagination
exports.getAllRides = async (req, res) => {
  try {
    // Extract query parameters
    const { 
      page = 1, 
      limit = 6,
      pickup,
      destination,
      minFare,
      maxFare,
      status,
      sortBy = 'requestedAt',
      date,
      seats
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build the query object
    let query = {};

    // Filter by status - default to rides that are still searching for drivers
    if (status) {
      query.status = status;
    } else {
      query.status = 'searching_driver';
    }

    // Filter by pickup location if provided
    if (pickup) {
      try {
        const [longitude, latitude] = pickup.split(',').map(coord => parseFloat(coord.trim()));
        query['pickup.location'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: 30000 // 30km in meters
          }
        };
      } catch (err) {
        console.log('Error parsing pickup coordinates:', err);
      }
    }

    // Filter by destination location if provided
    if (destination) {
      try {
        const [longitude, latitude] = destination.split(',').map(coord => parseFloat(coord.trim()));
        query['destination.location'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: 30000 // 30km in meters
          }
        };
      } catch (err) {
        console.log('Error parsing destination coordinates:', err);
      }
    }

    // Filter by fare range if provided
    if (minFare || maxFare) {
      query['fare.estimatedFare'] = {};
      if (minFare) query['fare.estimatedFare'].$gte = parseFloat(minFare);
      if (maxFare) query['fare.estimatedFare'].$lte = parseFloat(maxFare);
    }

    // Filter by date if provided
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.requestedAt = {
        $gte: searchDate,
        $lt: nextDay
      };
    }

    // Filter by number of seats if provided
    if (seats) {
      const seatsNum = parseInt(seats, 10);
      if (!isNaN(seatsNum) && seatsNum > 0) {
        query.availableSeats = { $gte: seatsNum };
      }
    }

    // Exclude rides created by the current user
    query.user = { $ne: req.user._id };

    // Build the sort options - most recent by default
    let sortOptions = {};
    if (sortBy === 'fare_low') {
      sortOptions = { 'fare.estimatedFare': 1 };
    } else if (sortBy === 'fare_high') {
      sortOptions = { 'fare.estimatedFare': -1 };
    } else if (sortBy === 'distance_low') {
      sortOptions = { estimatedDistance: 1 };
    } else if (sortBy === 'distance_high') {
      sortOptions = { estimatedDistance: -1 };
    } else {
      // Default to most recent
      sortOptions = { requestedAt: -1 };
    }

    // Count total documents for pagination
    const total = await Ride.countDocuments(query);

    // Execute query with pagination
    const rides = await Ride.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: 'user',
        select: 'name phoneNumber profilePicture ratings'
      });

    // Calculate total pages
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      status: 'success',
      data: {
        results: rides.length,
        totalPages,
        currentPage: pageNum,
        rides
      }
    });
  } catch (err) {
    console.error('Error getting rides:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Request to join a ride
exports.requestToJoinRide = async (req, res) => {
  try {
    const { seats = 1 } = req.body;
    const { rideId } = req.params;
    const userId = req.user.id;
    
    console.log(`User ${userId} requesting to join ride ${rideId} with ${seats} seats`);
    
    // Find the ride
    const ride = await Ride.findById(rideId);
    
    // Check if ride exists
    if (!ride) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride not found'
      });
    }
    
    // Check if ride is active
    if (ride.status !== 'ACTIVE') {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot join a ride with status: ${ride.status}`
      });
    }
    
    // Check if user is trying to join their own ride
    if (ride.driver.toString() === userId) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot join your own ride'
      });
    }
    
    // Convert seats to number and validate
    const seatsRequested = Number(seats);
    if (isNaN(seatsRequested) || seatsRequested < 1) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid number of seats requested'
      });
    }
    
    // Check if enough seats are available
    if (seatsRequested > ride.availableSeats) {
      return res.status(400).json({
        status: 'fail',
        message: `Not enough seats available. Only ${ride.availableSeats} seats remaining.`
      });
    }
    
    // Check if the user has already requested to join this ride
    const existingRequest = await RideRequest.findOne({
      ride: rideId,
      passenger: userId,
      status: { $in: ['PENDING', 'ACCEPTED'] }
    });
    
    if (existingRequest) {
      return res.status(400).json({
        status: 'fail',
        message: 'You have already requested to join this ride'
      });
    }
    
    // Create a ride request
    const rideRequest = new RideRequest({
      ride: rideId,
      passenger: userId,
      driver: ride.driver,
      seats: seatsRequested,
      status: 'PENDING',
      fare: ride.fare * seatsRequested, // Calculate total fare based on seats
    });
    
    // Save the request
    await rideRequest.save();
    
    // Update available seats temporarily (will be confirmed when accepted)
    await Ride.findByIdAndUpdate(rideId, {
      $inc: { availableSeats: -seatsRequested }
    });
    
    // Add this request to the ride's requests array
    await Ride.findByIdAndUpdate(rideId, {
      $push: { requests: rideRequest._id }
    });
    
    // Find driver for notification
    const driver = await User.findById(ride.driver);
    
    // Create notification for driver
    if (driver) {
      const passenger = await User.findById(userId);
      const notification = new Notification({
        recipient: driver._id,
        title: 'New Ride Request',
        message: `${passenger ? passenger.name : 'A passenger'} has requested to join your ride from ${ride.pickup.address} to ${ride.destination.address}`,
        type: 'RIDE_REQUEST',
        relatedId: rideRequest._id
      });
      
      await notification.save();
    }
    
    return res.status(201).json({
      status: 'success',
      message: 'Ride request created successfully',
      data: {
        rideRequest,
        requestId: rideRequest._id
      }
    });
  } catch (error) {
    console.error('Error in requestToJoinRide:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Cancel a ride request
exports.cancelRideRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Find rides where the user has a request with this ID
    const ride = await Ride.findOne({
      'passengers._id': requestId
    });
    
    if (!ride) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride request not found'
      });
    }
    
    // Find the specific passenger request and verify user owns the request
    const passengerRequest = ride.passengers.id(requestId);
    
    if (!passengerRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Passenger request not found'
      });
    }
    
    // Verify the request belongs to the current user
    if (passengerRequest.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to cancel this request'
      });
    }
    
    // Remove the passenger request
    ride.passengers.pull(requestId);
    await ride.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Ride request cancelled successfully',
      data: null
    });
  } catch (err) {
    console.error('Error cancelling ride request:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Cancel a ride request by request ID
exports.cancelRideRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    
    console.log(`User ${userId} attempting to cancel request ${requestId}`);
    
    // Find the ride request
    const rideRequest = await RideRequest.findById(requestId);
    
    if (!rideRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride request not found'
      });
    }
    
    // Check if the user owns this request
    if (rideRequest.passenger.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only cancel your own ride requests'
      });
    }
    
    // Check if the request is already cancelled or completed
    if (rideRequest.status === 'CANCELLED' || rideRequest.status === 'REJECTED') {
      return res.status(400).json({
        status: 'fail',
        message: `Request is already ${rideRequest.status.toLowerCase()}`
      });
    }
    
    // Check if the request is already accepted
    if (rideRequest.status === 'ACCEPTED') {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot cancel an accepted request. Please contact the driver.'
      });
    }
    
    // Update the request status
    rideRequest.status = 'CANCELLED';
    await rideRequest.save();
    
    // Find the ride and update available seats if status was PENDING
    if (rideRequest.status === 'PENDING') {
      const ride = await Ride.findById(rideRequest.ride);
      if (ride) {
        // Restore the seats
        ride.availableSeats += rideRequest.seats;
        await ride.save();
      }
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Ride request cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling ride request by ID:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get passenger rides
exports.getMyPassengerRides = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all ride requests for this user
    const rideRequests = await RideRequest.find({ passenger: userId })
      .populate({
        path: 'ride',
        populate: {
          path: 'driver',
          select: 'name phoneNumber vehicle'
        }
      })
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      status: 'success',
      results: rideRequests.length,
      data: {
        requests: rideRequests
      }
    });
  } catch (error) {
    console.error('Error getting passenger rides:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get my driver rides
exports.getMyDriverRides = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all rides where the user is the driver
    const rides = await Ride.find({ driver: userId })
      .populate({
        path: 'requests',
        populate: {
          path: 'passenger',
          select: 'name phoneNumber profilePicture'
        }
      })
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      status: 'success',
      results: rides.length,
      data: {
        rides
      }
    });
  } catch (error) {
    console.error('Error getting driver rides:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Respond to a passenger request (accept/reject)
exports.respondToPassengerRequest = async (req, res) => {
  try {
    const { rideId, requestId } = req.params;
    const { status, message } = req.body;
    const userId = req.user._id;
    
    // Validate status
    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Status must be either ACCEPTED or REJECTED'
      });
    }
    
    // Find the ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride not found'
      });
    }
    
    // Check if user is the driver of this ride
    if (ride.driver.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You must be the driver of this ride to respond to requests'
      });
    }
    
    // Find the request
    const request = await RideRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'Request not found'
      });
    }
    
    // Check if request belongs to this ride
    if (request.ride.toString() !== rideId.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'This request does not belong to the specified ride'
      });
    }
    
    // Check if request is pending
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot respond to a request with status: ${request.status}`
      });
    }
    
    // Update request status
    request.status = status;
    request.responseMessage = message || '';
    await request.save();
    
    // If accepting, don't modify available seats since they were already reduced
    // If rejecting, restore the available seats
    if (status === 'REJECTED') {
      ride.availableSeats += request.seats;
      await ride.save();
    }
    
    // Create notification for passenger
    const notification = new Notification({
      recipient: request.passenger,
      title: status === 'ACCEPTED' ? 'Ride Request Accepted' : 'Ride Request Rejected',
      message: status === 'ACCEPTED' 
        ? `Your request to join a ride from ${ride.pickup.address} to ${ride.destination.address} has been accepted.`
        : `Your request to join a ride from ${ride.pickup.address} to ${ride.destination.address} has been rejected.${message ? ` Reason: ${message}` : ''}`,
      type: status === 'ACCEPTED' ? 'RIDE_ACCEPTED' : 'RIDE_REJECTED',
      relatedId: request._id
    });
    
    await notification.save();
    
    return res.status(200).json({
      status: 'success',
      message: `Request ${status.toLowerCase()} successfully`,
      data: {
        request
      }
    });
  } catch (error) {
    console.error('Error responding to passenger request:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Add ride review
exports.addRideReview = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'fail',
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Find the ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride not found'
      });
    }
    
    // Check if user was part of the ride
    const wasPassenger = ride.user.toString() === userId.toString();
    const wasDriver = ride.driver && ride.driver.toString() === userId.toString();
    
    if (!wasPassenger && !wasDriver) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only review rides you participated in'
      });
    }
    
    // Update ride with review
    if (wasPassenger) {
      // Passenger reviewing driver
      ride.ratings.userToDriver = {
        rating,
        comment: comment || ''
      };
    } else {
      // Driver reviewing passenger
      ride.ratings.driverToUser = {
        rating,
        comment: comment || ''
      };
    }
    
    await ride.save();
    
    return res.status(200).json({
      status: 'success',
      message: 'Review submitted successfully',
      data: {
        review: wasPassenger ? ride.ratings.userToDriver : ride.ratings.driverToUser
      }
    });
  } catch (error) {
    console.error('Error adding ride review:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Find nearby rides
exports.getNearbyRides = async (req, res) => {
  try {
    const { lat, lng, radius = 30 } = req.query; // radius in km
    
    if (!lat || !lng) {
      return res.status(400).json({
        status: 'fail',
        message: 'Latitude and longitude are required'
      });
    }
    
    const coords = [parseFloat(lng), parseFloat(lat)];
    
    // Find rides with pickup or destination near the provided coordinates
    const rides = await Ride.find({
      status: 'ACTIVE',
      $or: [
        {
          'pickup.location': {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: coords
              },
              $maxDistance: parseInt(radius) * 1000 // Convert km to meters
            }
          }
        },
        {
          'destination.location': {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: coords
              },
              $maxDistance: parseInt(radius) * 1000
            }
          }
        }
      ]
    }).limit(20);
    
    return res.status(200).json({
      status: 'success',
      results: rides.length,
      data: {
        rides
      }
    });
  } catch (error) {
    console.error('Error finding nearby rides:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Search rides
exports.searchRides = async (req, res) => {
  try {
    const { 
      pickupLat, 
      pickupLng, 
      destLat, 
      destLng, 
      date, 
      seats,
      radius = 30  // km
    } = req.query;
    
    let query = { status: 'ACTIVE' };
    
    // Add pickup location filter if provided
    if (pickupLat && pickupLng) {
      query['pickup.location'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(pickupLng), parseFloat(pickupLat)]
          },
          $maxDistance: parseInt(radius) * 1000 // Convert km to meters
        }
      };
    }
    
    // Add destination location filter if provided
    if (destLat && destLng) {
      query['destination.location'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(destLng), parseFloat(destLat)]
          },
          $maxDistance: parseInt(radius) * 1000
        }
      };
    }
    
    // Add date filter if provided
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.departureTime = {
        $gte: searchDate,
        $lt: nextDay
      };
    }
    
    // Add seats filter if provided
    if (seats) {
      query.availableSeats = { $gte: parseInt(seats) };
    }
    
    // Execute the query
    const rides = await Ride.find(query).limit(50);
    
    return res.status(200).json({
      status: 'success',
      results: rides.length,
      data: {
        rides
      }
    });
  } catch (error) {
    console.error('Error searching rides:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get public active rides
exports.getPublicActiveRides = async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'ACTIVE' })
      .sort({ createdAt: -1 })
      .limit(10);
    
    return res.status(200).json({
      status: 'success',
      results: rides.length,
      data: {
        rides
      }
    });
  } catch (error) {
    console.error('Error getting public active rides:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}; 