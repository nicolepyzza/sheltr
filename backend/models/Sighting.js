const mongoose = require('mongoose');

const sightingSchema = new mongoose.Schema({
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
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
  sightedAt: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    maxlength: 500
  },
  imageUrl: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for location-based queries
sightingSchema.index({ location: '2dsphere' });
sightingSchema.index({ petId: 1, sightedAt: -1 });

module.exports = mongoose.model('Sighting', sightingSchema);
