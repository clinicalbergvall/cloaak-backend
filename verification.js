const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const CleanerProfile = require('../models/CleanerProfile');


router.get('/status', (req, res) => {
  res.json({ message: 'Verification status OK' });
});


router.post('/verify', (req, res) => {
  res.json({ message: 'Verification request received' });
});


router.post('/resend', (req, res) => {
  res.json({ message: 'Verification code resent' });
});




router.get('/pending-profiles', protect, authorize('admin'), async (req, res) => {
  try {
    const { city, service, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { approvalStatus: 'pending' };
    if (city) query.city = new RegExp(city, 'i');
    if (service) query.services = service;

    const [cleaners, total] = await Promise.all([
      CleanerProfile.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CleanerProfile.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: cleaners.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      cleaners
    });
  } catch (error) {
    console.error('Fetch pending profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending profiles',
      error: error.message
    });
  }
});




router.put('/approve-profile/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const profile = await CleanerProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Cleaner profile not found'
      });
    }

    if (profile.approvalStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Profile is already approved'
      });
    }

    
    profile.approvalStatus = 'approved';
    profile.approvedAt = new Date();
    profile.approvalNotes = adminNotes || '';
    profile.verified = true;

    
    profile.approvalHistory.push({
      status: 'approved',
      notes: adminNotes || 'Approved by admin',
      admin: req.user.id,
      changedAt: new Date()
    });

    await profile.save();

    res.json({
      success: true,
      message: `${profile.firstName} ${profile.lastName} approved successfully`,
      profile
    });
  } catch (error) {
    console.error('Approve profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving profile',
      error: error.message
    });
  }
});




router.put('/reject-profile/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { rejectionReason, adminNotes } = req.body;
    const profile = await CleanerProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Cleaner profile not found'
      });
    }

    if (profile.approvalStatus === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Profile is already rejected'
      });
    }

    
    profile.approvalStatus = 'rejected';
    profile.rejectedAt = new Date();
    profile.approvalNotes = adminNotes || rejectionReason || '';

    
    profile.approvalHistory.push({
      status: 'rejected',
      notes: adminNotes || rejectionReason || 'Rejected by admin',
      admin: req.user.id,
      changedAt: new Date()
    });

    await profile.save();

    res.json({
      success: true,
      message: `${profile.firstName} ${profile.lastName} rejected`,
      profile
    });
  } catch (error) {
    console.error('Reject profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting profile',
      error: error.message
    });
  }
});

module.exports = router;





