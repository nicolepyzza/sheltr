const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToCloudinary } = require('../utils/cloudinary');
const Sighting = require('../models/Sighting');
const Pet = require('../models/Pet');

// @route   POST /api/sightings
// @desc    Report a new sighting of a pet
// @access  Private
router.post(
  '/',
  [
    authMiddleware,
    upload.single('image'),
    [
      body('petId').notEmpty().withMessage('Pet ID is required'),
      body('latitude').isFloat().withMessage('Valid latitude is required'),
      body('longitude').isFloat().withMessage('Valid longitude is required'),
      body('address').notEmpty().withMessage('Address is required'),
    ],
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { petId, latitude, longitude, address, sightedAt, notes } = req.body;

      // Check if pet exists
      const pet = await Pet.findById(petId);
      if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
      }

      // Upload image to Cloudinary if provided
      let imageUrl = null;
      if (req.file) {
        imageUrl = await uploadToCloudinary(req.file.buffer, 'sheltr/sightings');
      }

      // Create new sighting
      const sighting = new Sighting({
        petId,
        userId: req.user._id,
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
          address,
        },
        sightedAt: sightedAt ? new Date(sightedAt) : new Date(),
        notes,
        imageUrl,
      });

      await sighting.save();

      // Populate user info before sending response
      await sighting.populate('userId', 'username');

      res.status(201).json(sighting);
    } catch (error) {
      console.error('Create sighting error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// @route   GET /api/sightings/:petId
// @desc    Get all sightings for a specific pet
// @access  Public
router.get('/:petId', async (req, res) => {
  try {
    const sightings = await Sighting.find({ petId: req.params.petId })
      .populate('userId', 'username')
      .sort({ sightedAt: -1 });

    res.json(sightings);
  } catch (error) {
    console.error('Get sightings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
