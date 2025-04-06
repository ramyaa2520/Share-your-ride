const mongoose = require('mongoose');
const User = require('./User');

const driverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    drivingLicense: {
      number: {
        type: String,
        required: [true, 'Driving license number is required']
      },
      expiryDate: {
        type: Date,
        required: [true, 'License expiry date is required']
      },
      verified: {
        type: Boolean,
        default: false
      }
    },
    vehicle: {
      make: {
        type: String,
        required: [true, 'Vehicle make is required']
      },
      model: {
        type: String,
        required: [true, 'Vehicle model is required']
      },
      year: {
        type: Number,
        required: [true, 'Vehicle year is required']
      },
      color: {
        type: String,
        required: [true, 'Vehicle color is required']
      },
      licensePlate: {
        type: String,
        required: [true, 'License plate is required'],
        unique: true
      },
      vehicleType: {
        type: String,
        enum: ['economy', 'comfort', 'premium', 'suv'],
        default: 'economy'
      }
    },
    isAvailable: {
      type: Boolean,
      default: false
    },
    currentLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    activeRide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      default: null
    },
    earnings: {
      total: {
        type: Number,
        default: 0
      },
      currentWeek: {
        type: Number,
        default: 0
      },
      currentMonth: {
        type: Number,
        default: 0
      }
    },
    completedRides: {
      type: Number,
      default: 0
    },
    ratings: {
      average: {
        type: Number,
        default: 0
      },
      count: {
        type: Number,
        default: 0
      }
    },
    bankAccountInfo: {
      accountNumber: String,
      routingNumber: String,
      bankName: String
    },
    documents: [
      {
        type: {
          type: String,
          enum: ['insurance', 'registration', 'inspection', 'other'],
          required: true
        },
        fileUrl: String,
        uploadDate: {
          type: Date,
          default: Date.now
        },
        verified: {
          type: Boolean,
          default: false
        }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create index for geospatial queries
driverSchema.index({ currentLocation: '2dsphere' });

// Populate driver with user details
driverSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email phoneNumber profilePicture'
  });
  next();
});

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver; 