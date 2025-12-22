const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['lost', 'stray'],
    required: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  breeds: [{
    type: String,
    trim: true
  }],
  colors: [{
    type: String,
    trim: true
  }],
  behavior: {
    type: String,
    maxlength: 500
  },
  initialLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  initialTime: {
    type: Date,
    required: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'found', 'resolved'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for location-based queries
petSchema.index({ initialLocation: '2dsphere' });

// Update the updatedAt timestamp before saving
petSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Pet', petSchema);
