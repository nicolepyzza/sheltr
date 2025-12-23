const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    // This is the REPORTER - the person who first posted about the pet
  },
  claimedOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    // This is the VERIFIED OWNER - may be same as reporter or claimed later
  },
  type: {
    type: String,
    enum: ['lost', 'stray'],
    required: true
  },
  petType: {
    type: String,
    enum: ['dog', 'cat', 'other'],
    default: 'other'
  },
  petName: {
    type: String,
    trim: true,
    // Required for lost pets, optional for strays
  },
  contactPhone: {
    type: String,
    trim: true,
    // Private - only for lost pets (owner contact)
  },
  microchipNumber: {
    type: String,
    trim: true,
    // Always private - never shown publicly
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
    enum: ['active', 'pending_found', 'found', 'resolved', 'owner_unknown', 'ownership_pending', 'no_longer_sighted', 'transferred_to_shelter'],
    default: 'owner_unknown' // Default for stray reports
  },
  ownershipClaims: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    verificationPhoto: {
      type: String,
      required: true
    },
    verificationAnswers: {
      collarColor: String,
      hasMicrochip: Boolean,
      uniqueMarks: String,
      microchipId: String, // Never shown publicly
    },
    claimedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    denialReason: String
  }],
  foundClaims: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    photoUrl: {
      type: String,
      required: true
    },
    notes: {
      type: String,
      maxlength: 500
    },
    claimedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'disputed'],
      default: 'pending'
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    confirmedAt: Date
  }],
  resolvedAt: {
    type: Date
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
