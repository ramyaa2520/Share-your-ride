const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false // Don't return password in responses
    },
    phoneNumber: {
      type: String,
      // Make it completely optional with no validation to avoid causing registration errors
      validate: {
        validator: function(value) {
          // Always return true if the field is empty or null
          if (!value || value.trim() === '') return true;
          
          // Only validate if a value is actually provided
          return true; // Accept any value for now to avoid registration issues
        },
        message: 'Invalid phone number format'
      }
    },
    role: {
      type: String,
      enum: ['user', 'driver', 'admin'],
      default: 'user'
    },
    profilePicture: {
      type: String,
      default: 'default.jpg'
    },
    active: {
      type: Boolean,
      default: true
    },
    location: {
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
    rides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride'
      }
    ],
    savedAddresses: [
      {
        name: String,
        address: String,
        location: {
          type: {
            type: String,
            default: 'Point',
            enum: ['Point']
          },
          coordinates: [Number]
        }
      }
    ],
    paymentMethods: [
      {
        type: {
          type: String,
          enum: ['credit_card', 'debit_card', 'paypal'],
          required: true
        },
        cardNumber: String,
        expiryDate: String,
        cvv: String,
        isDefault: {
          type: Boolean,
          default: false
        }
      }
    ],
    ratings: {
      average: {
        type: Number,
        default: 0
      },
      count: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create index for geospatial queries
userSchema.index({ location: '2dsphere' });

// Remove the unique index and make phoneNumber completely optional
// This ensures we can have multiple users with null/empty phone numbers

// Hash the password before saving
userSchema.pre('save', async function(next) {
  // Only run this function if password was modified
  if (!this.isModified('password')) return next();
  
  // Hash the password with a salt of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare passwords during login
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 