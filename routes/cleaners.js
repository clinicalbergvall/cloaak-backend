const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const CleanerProfile = require('../models/CleanerProfile');
const User = require('../models/User');




router.post('/profile', protect, async (req, res) => {
  try {
    
    if (req.user.role !== 'cleaner') {
      return res.status(403).json({
        success: false,
        message: 'Only users with cleaner role can submit profiles'
      });
    }
    
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
      message: 'Profile submitted for verification. Our team will review your documents and approve your account.',
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




router.put('/profile', protect, authorize('cleaner'), async (req, res) => {
  try {
    let profile = await CleanerProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    profile = await CleanerProfile.findOneAndUpdate(
      { user: req.user.id },
      req.body,
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
