const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const User = require('../models/User');

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

// Request to join an existing ride
exports.requestToJoinRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { seats = 1, message } = req.body;
    
    // Find the ride
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ride not found'
      });
    }
    
    // Check if ride is available for passengers
    if (ride.status !== 'searching_driver') {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot join a ride with status: ${ride.status}`
      });
    }
    
    // Check if user is already a passenger
    const isAlreadyPassenger = ride.passengers && ride.passengers.some(
      p => p.user.toString() === req.user._id.toString()
    );
    
    if (isAlreadyPassenger) {
      return res.status(400).json({
        status: 'fail',
        message: 'You have already requested to join this ride'
      });
    }
    
    // Check if there are enough available seats
    const requestedSeats = parseInt(seats, 10) || 1;
    const totalPassengerSeats = ride.passengers.reduce(
      (total, passenger) => total + (passenger.seats || 1), 
      0
    );
    
    if ((totalPassengerSeats + requestedSeats) > ride.seats) {
      return res.status(400).json({
        status: 'fail',
        message: `Not enough available seats. Only ${ride.seats - totalPassengerSeats} seats left`
      });
    }
    
    // Get user details
    const user = await User.findById(req.user._id);
    
    // Add the passenger request
    ride.passengers.push({
      user: req.user._id,
      seats: requestedSeats,
      status: 'pending',
      message: message || '',
      contactPhone: user.phoneNumber || '',
      requestedAt: new Date()
    });
    
    await ride.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Your request to join the ride has been submitted',
      data: {
        ride
      }
    });
  } catch (err) {
    console.error('Error requesting to join ride:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message
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