const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const CleanerProfile = require('../models/CleanerProfile');
const User = require('../models/User');




router.post('/profile', protect, async (req, res) => {
  try {
    // Check if profile already exists for this user
    const existingProfile = await CleanerProfile.findOne({ user: req.user.id });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Profile already exists. Use PUT to update.'
      });
    }

    
    const profileData = {
      user: req.user.id,
      ...req.body,
      approvalStatus: 'pending',
      verified: false
    };

    const profile = await CleanerProfile.create(profileData);

    res.status(201).json({
      success: true,
      message: 'Profile created successfully! You can now access all platform features.',
      profile
    });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating profile',
      error: error.message
    });
  }
});




router.get('/profile', protect, authorize('cleaner'), async (req, res) => {
  try {
    const profile = await CleanerProfile.findOne({ user: req.user.id }).populate('user', 'name email phone');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});




// Sanitization helper function
function sanitizeProfileInput(data) {
  const sanitized = { ...data };
  
  // Sanitize text fields
  if (sanitized.bio && typeof sanitized.bio === 'string') {
    sanitized.bio = sanitized.bio.replace(/<[^>]*>/g, '');
    sanitized.bio = sanitized.bio.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized.bio = sanitized.bio.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized.bio = sanitized.bio.replace(/javascript:/gi, '');
    if (sanitized.bio.length > 500) {
      sanitized.bio = sanitized.bio.substring(0, 500);
    }
  }
  
  // Sanitize string fields
  const stringFields = ['firstName', 'lastName', 'address', 'city', 'email'];
  stringFields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitized[field].replace(/<[^>]*>/g, '').trim();
      sanitized[field] = sanitized[field].replace(/\0/g, ''); // Remove null bytes
    }
  });
  
  return sanitized;
}

router.put('/profile', protect, authorize('cleaner'), async (req, res) => {
  try {
    let profile = await CleanerProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Sanitize input before updating
    const sanitizedData = sanitizeProfileInput(req.body);

    profile = await CleanerProfile.findOneAndUpdate(
      { user: req.user.id },
      sanitizedData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});




router.get('/', async (req, res) => {
  try {
    const { service, city, minRating } = req.query;

    let query = { isAvailable: true };

    if (service) {
      query.services = service;
    }

    if (city) {
      query.city = new RegExp(city, 'i');
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    const cleaners = await CleanerProfile.find(query)
      .populate('user', 'name phone profileImage')
      .sort({ rating: -1, completedJobs: -1 });

    res.json({
      success: true,
      count: cleaners.length,
      cleaners
    });
  } catch (error) {
    console.error('Fetch cleaners error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cleaners'
    });
  }
});




router.get('/:id', async (req, res) => {
  try {
    const profile = await CleanerProfile.findById(req.params.id)
      .populate('user', 'name phone email profileImage');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Cleaner profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Fetch cleaner error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cleaner profile'
    });
  }
});

module.exports = router;
