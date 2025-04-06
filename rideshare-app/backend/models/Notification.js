const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A notification must have a recipient']
    },
    title: {
      type: String,
      required: [true, 'Notification title is required']
    },
    message: {
      type: String,
      required: [true, 'Notification message is required']
    },
    type: {
      type: String,
      enum: ['RIDE_REQUEST', 'RIDE_ACCEPTED', 'RIDE_REJECTED', 'RIDE_CANCELLED', 'DRIVER_ARRIVED', 'RIDE_COMPLETED', 'PAYMENT', 'SYSTEM'],
      default: 'SYSTEM'
    },
    read: {
      type: Boolean,
      default: false
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    action: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Create index for faster queries
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 