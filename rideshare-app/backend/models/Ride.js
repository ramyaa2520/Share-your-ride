const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A ride must belong to a user']
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null
    },
    status: {
      type: String,
      enum: [
        'requested',
        'searching_driver',
        'driver_assigned',
        'driver_arrived',
        'in_progress',
        'completed',
        'cancelled'
      ],
      default: 'requested'
    },
    pickup: {
      address: {
        type: String,
        required: [true, 'Pickup address is required']
      },
      location: {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: {
          type: [Number],
          required: [true, 'Pickup coordinates are required']
        }
      }
    },
    destination: {
      address: {
        type: String,
        required: [true, 'Destination address is required']
      },
      location: {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: {
          type: [Number],
          required: [true, 'Destination coordinates are required']
        }
      }
    },
    rideType: {
      type: String,
      enum: ['economy', 'comfort', 'premium', 'suv'],
      default: 'economy'
    },
    estimatedDistance: {
      type: Number, // in kilometers
      required: [true, 'Estimated distance is required']
    },
    estimatedDuration: {
      type: Number, // in minutes
      required: [true, 'Estimated duration is required']
    },
    fare: {
      estimatedFare: {
        type: Number,
        required: [true, 'Estimated fare is required']
      },
      actualFare: {
        type: Number,
        default: null
      },
      currency: {
        type: String,
        default: 'USD'
      },
      breakdown: {
        baseFare: {
          type: Number,
          default: 0
        },
        distanceFare: {
          type: Number,
          default: 0
        },
        timeFare: {
          type: Number,
          default: 0
        },
        surge: {
          type: Number,
          default: 0
        },
        tax: {
          type: Number,
          default: 0
        }
      }
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'cash'],
      default: 'credit_card'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancellationReason: {
      type: String,
      default: null
    },
    cancelledBy: {
      type: String,
      enum: ['user', 'driver', 'system', null],
      default: null
    },
    route: {
      type: {
        type: String,
        default: 'LineString',
        enum: ['LineString']
      },
      coordinates: {
        type: [[Number]],
        default: []
      }
    },
    ratings: {
      userToDriver: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
          default: null
        },
        comment: {
          type: String,
          default: null
        }
      },
      driverToUser: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
          default: null
        },
        comment: {
          type: String,
          default: null
        }
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create indexes for geospatial queries
rideSchema.index({ 'pickup.location': '2dsphere' });
rideSchema.index({ 'destination.location': '2dsphere' });

// Populate ride with user and driver details
rideSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email phoneNumber profilePicture'
  }).populate({
    path: 'driver',
    select: 'user vehicle currentLocation'
  });
  next();
});

// Calculate ride duration
rideSchema.virtual('duration').get(function() {
  if (this.startedAt && this.completedAt) {
    return Math.round((this.completedAt - this.startedAt) / (1000 * 60)); // duration in minutes
  }
  return null;
});

const Ride = mongoose.model('Ride', rideSchema);

module.exports = Ride; 