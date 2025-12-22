const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToCloudinary } = require('../utils/cloudinary');
const Pet = require('../models/Pet');
const Sighting = require('../models/Sighting');

// @route   GET /api/pets
// @desc    Get all pets (feed)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    
    const query = { status: 'active' };
    if (type && ['lost', 'stray'].includes(type)) {
      query.type = type;
    }

    const pets = await Pet.find(query)
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Pet.countDocuments(query);

    res.json({
      pets,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/pets/:id
// @desc    Get single pet details with sightings
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id)
      .populate('userId', 'username');

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Get all sightings for this pet
    const sightings = await Sighting.find({ petId: pet._id })
      .populate('userId', 'username')
      .sort({ sightedAt: -1 });

    // Increment view count
    pet.viewCount += 1;
    await pet.save();

    res.json({
      pet,
      sightings,
    });
  } catch (error) {
    console.error('Get pet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/pets
// @desc    Report a lost/stray pet
// @access  Private
router.post(
  '/',
  [
    authMiddleware,
    upload.single('image'),
    [
      body('type').isIn(['lost', 'stray']).withMessage('Type must be lost or stray'),
      body('description').notEmpty().withMessage('Description is required'),
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

      const {
        type,
        petType,
        description,
        breeds,
        colors,
        behavior,
        latitude,
        longitude,
        address,
        initialTime,
      } = req.body;

      // Upload image to Cloudinary if provided
      let imageUrl = null;
      if (req.file) {
        imageUrl = await uploadToCloudinary(req.file.buffer, 'sheltr/pets');
      }

      // Parse arrays if they're sent as JSON strings
      const parsedBreeds = typeof breeds === 'string' ? JSON.parse(breeds) : breeds || [];
      const parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors || [];

      // Create new pet
      const pet = new Pet({
        userId: req.user._id,
        type,
        petType: petType || 'other',
        imageUrl,
        description,
        breeds: parsedBreeds,
        colors: parsedColors,
        behavior,
        initialLocation: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
          address,
        },
        initialTime: initialTime ? new Date(initialTime) : new Date(),
      });

      await pet.save();

      res.status(201).json(pet);
    } catch (error) {
      console.error('Create pet error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// @route   PATCH /api/pets/:id/status
// @desc    Update pet status
// @access  Private
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'found', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Only the creator can update status
    if (pet.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    pet.status = status;
    await pet.save();

    res.json(pet);
  } catch (error) {
    console.error('Update pet status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
