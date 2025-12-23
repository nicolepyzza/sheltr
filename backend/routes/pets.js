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
        petName,
        contactPhone,
        microchipNumber,
        description,
        breeds,
        colors,
        behavior,
        latitude,
        longitude,
        address,
        initialTime,
      } = req.body;

      // Additional validation for lost pets (owner reporting)
      if (type === 'lost') {
        if (!petName || !req.file || !breeds) {
          return res.status(400).json({ message: 'Lost pets require name, photo, and breed(s)' });
        }
      }

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
        petName: petName || null,
        contactPhone: type === 'lost' ? contactPhone : null, // Only for lost pets
        microchipNumber: microchipNumber || null,
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
        // Set status and owner based on type
        status: type === 'lost' ? 'active' : 'owner_unknown',
        claimedOwner: type === 'lost' ? req.user._id : null, // Lost pet = reporter is owner
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

    if (!['active', 'pending_found', 'found', 'resolved', 'owner_unknown', 'ownership_pending', 'no_longer_sighted', 'transferred_to_shelter'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Only the reporter or claimed owner can update status
    const isReporter = pet.userId.toString() === req.user._id.toString();
    const isOwner = pet.claimedOwner && pet.claimedOwner.toString() === req.user._id.toString();
    
    if (!isReporter && !isOwner) {
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

// @route   POST /api/pets/:id/claim-ownership
// @desc    Claim ownership of a pet with verification
// @access  Private
router.post('/:id/claim-ownership',
  [authMiddleware, upload.single('verificationPhoto')],
  async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.id);

      if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
      }

      if (pet.claimedOwner) {
        return res.status(400).json({ message: 'Pet already has a claimed owner' });
      }

      // Can't claim your own report as stray
      if (pet.userId.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'You are already the reporter' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Verification photo is required' });
      }

      // Upload photo
      const photoUrl = await uploadToCloudinary(req.file.buffer, 'sheltr/ownership-claims');

      const { collarColor, hasMicrochip, uniqueMarks, microchipId } = req.body;

      // Add ownership claim
      pet.ownershipClaims.push({
        userId: req.user._id,
        verificationPhoto: photoUrl,
        verificationAnswers: {
          collarColor,
          hasMicrochip: hasMicrochip === 'true',
          uniqueMarks,
          microchipId, // Keep private
        },
        status: 'pending'
      });

      pet.status = 'ownership_pending';
      await pet.save();

      await pet.populate('ownershipClaims.userId', 'username');

      res.json({
        message: 'Ownership claim submitted. Waiting for reporter verification.',
        pet
      });
    } catch (error) {
      console.error('Claim ownership error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// @route   PATCH /api/pets/:id/verify-ownership
// @desc    Approve or deny ownership claim (reporter only)
// @access  Private
router.patch('/:id/verify-ownership', authMiddleware, async (req, res) => {
  try {
    const { claimId, approved, denialReason } = req.body;
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Only reporter can verify
    if (pet.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the original reporter can verify ownership' });
    }

    const claim = pet.ownershipClaims.id(claimId);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({ message: 'Claim already resolved' });
    }

    if (approved) {
      claim.status = 'approved';
      claim.reviewedBy = req.user._id;
      claim.reviewedAt = new Date();
      pet.claimedOwner = claim.userId;
      pet.status = 'active';
    } else {
      claim.status = 'denied';
      claim.reviewedBy = req.user._id;
      claim.reviewedAt = new Date();
      claim.denialReason = denialReason || 'Insufficient verification';
      pet.status = pet.type === 'stray' ? 'owner_unknown' : 'active';
    }

    await pet.save();
    await pet.populate('ownershipClaims.userId ownershipClaims.reviewedBy claimedOwner', 'username');

    res.json({
      message: approved ? 'Ownership verified' : 'Ownership claim denied',
      pet
    });
  } catch (error) {
    console.error('Verify ownership error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/pets/:id/claim-found
// @desc    Claim a pet has been found (with photo verification)
// @access  Private
router.post('/:id/claim-found', 
  [authMiddleware, upload.single('photo')],
  async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.id);

      if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
      }

      if (pet.status !== 'active') {
        return res.status(400).json({ message: 'Pet is not active' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Photo is required for verification' });
      }

      // Upload photo to Cloudinary
      const photoUrl = await uploadToCloudinary(req.file.buffer, 'sheltr/found-claims');

      // Add found claim
      pet.foundClaims.push({
        userId: req.user._id,
        photoUrl,
        notes: req.body.notes || '',
        status: 'pending'
      });

      pet.status = 'pending_found';
      await pet.save();

      await pet.populate('foundClaims.userId', 'username');

      res.json({ 
        message: 'Safety claim submitted. Waiting for verification (48 hours).',
        pet 
      });
    } catch (error) {
      console.error('Claim found error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// @route   PATCH /api/pets/:id/confirm-found
// @desc    Confirm a found claim (by claimed owner only)
// @access  Private
router.patch('/:id/confirm-found', authMiddleware, async (req, res) => {
  try {
    const { claimId } = req.body;
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Only claimed owner can confirm
    if (!pet.claimedOwner || pet.claimedOwner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the verified owner can confirm reunification' });
    }

    const claim = pet.foundClaims.id(claimId);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({ message: 'Claim already resolved' });
    }

    claim.status = 'confirmed';
    claim.confirmedBy = req.user._id;
    claim.confirmedAt = new Date();
    pet.status = 'found';
    pet.resolvedAt = new Date();

    await pet.save();
    await pet.populate('foundClaims.userId foundClaims.confirmedBy', 'username');

    res.json({ message: 'Pet marked as safe', pet });
  } catch (error) {
    console.error('Confirm found error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/pets/:id/dispute-found
// @desc    Dispute a found claim
// @access  Private
router.patch('/:id/dispute-found', authMiddleware, async (req, res) => {
  try {
    const { claimId, reason } = req.body;
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    const claim = pet.foundClaims.id(claimId);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({ message: 'Claim already resolved' });
    }

    claim.status = 'disputed';
    claim.confirmedBy = req.user._id;
    claim.confirmedAt = new Date();
    claim.notes = (claim.notes || '') + `\n[DISPUTED by ${req.user.username}: ${reason}]`;
    pet.status = 'active'; // Return to active

    await pet.save();
    await pet.populate('foundClaims.userId foundClaims.confirmedBy', 'username');

    res.json({ message: 'Claim disputed. Pet marked as active again.', pet });
  } catch (error) {
    console.error('Dispute found error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
