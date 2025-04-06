const mongoose = require('mongoose');

const rideRequestSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: [true, 'A request must be associated with a ride']
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A request must have a passenger']
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A request must have a driver']
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING'
    },
    seats: {
      type: Number,
      required: [true, 'Number of seats is required'],
      min: 1
    },
    fare: {
      type: Number,
      default: 0
    },
    message: {
      type: String,
      default: ''
    },
    responseMessage: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Populate request with passenger and driver details
rideRequestSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'passenger',
    select: 'name email phoneNumber profilePicture'
  });
  next();
});

const RideRequest = mongoose.model('RideRequest', rideRequestSchema);

module.exports = RideRequest; 