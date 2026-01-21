const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const CleanerProfile = require('../models/CleanerProfile');
const Booking = require('../models/Booking');
const User = require('../models/User');








router.get('/cleaners/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const { city, service, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { approvalStatus: 'pending' };
    if (city) query.city = new RegExp(city, 'i');
    if (service) query.services = service;

    const [cleaners, total] = await Promise.all([
      CleanerProfile.find(query)
        .populate('user', 'name email phone')
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
    console.error('Fetch pending cleaners error:', error);
    
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching pending cleaners',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});




router.get('/cleaners/approved', protect, authorize('admin'), async (req, res) => {
  try {
    const { city, service, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { approvalStatus: 'approved' };
    if (city) query.city = new RegExp(city, 'i');
    if (service) query.services = service;

    const [cleaners, total] = await Promise.all([
      CleanerProfile.find(query)
        .populate('user', 'name email phone')
        .sort({ approvedAt: -1 })
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
    console.error('Fetch approved cleaners error:', error);
    
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching approved cleaners',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});




router.get('/cleaners/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const profile = await CleanerProfile.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('approvalHistory.admin', 'name email');

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
    
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching cleaner profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});




router.put('/cleaners/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { notes } = req.body;
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
        message: 'Cleaner is already approved'
      });
    }

    
    profile.approvalStatus = 'approved';
    profile.approvedAt = new Date();
    profile.approvalNotes = notes || '';

    
    profile.approvalHistory.push({
      status: 'approved',
      notes: notes || 'Approved by admin',
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
    console.error('Approve cleaner error:', error);
    
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Error approving cleaner',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});




router.put('/cleaners/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { notes } = req.body;
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
        message: 'Cleaner is already rejected'
      });
    }

    
    profile.approvalStatus = 'rejected';
    profile.rejectedAt = new Date();
    profile.approvalNotes = notes || '';

    
    profile.approvalHistory.push({
      status: 'rejected',
      notes: notes || 'Rejected by admin',
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
    console.error('Reject cleaner error:', error);
    
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Error rejecting cleaner',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});








router.get('/clients', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const bookings = await Booking.find()
      .populate('client', 'name email phone')
      .populate('cleaner', 'firstName lastName')
      .sort({ createdAt: -1 });

    
    const clientMap = new Map();
    bookings.forEach(booking => {
      const clientId = booking.client._id.toString();
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          clientId,
          name: booking.client.name,
          email: booking.client.email,
          phone: booking.client.phone,
          totalBookings: 0,
          totalSpent: 0,
          lastBooking: null,
          status: 'active'
        });
      }
      const client = clientMap.get(clientId);
      client.totalBookings += 1;
      client.totalSpent += booking.price || 0;
      if (!client.lastBooking || new Date(booking.createdAt) > new Date(client.lastBooking)) {
        client.lastBooking = booking.createdAt;
      }
    });

    const clients = Array.from(clientMap.values()).slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      count: clients.length,
      total: clientMap.size,
      page: parseInt(page),
      pages: Math.ceil(clientMap.size / limit),
      clients
    });
  } catch (error) {
    console.error('Fetch clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching clients',
      error: error.message
    });
  }
});




router.get('/bookings', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, serviceCategory, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (serviceCategory) query.serviceCategory = serviceCategory;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('client', 'name email phone')
        .populate('cleaner', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      bookings
    });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});




router.get('/dashboard/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [totalCleaners, pendingCleaners, approvedCleaners, totalBookings, completedBookings, totalRevenue] = await Promise.all([
      CleanerProfile.countDocuments(),
      CleanerProfile.countDocuments({ approvalStatus: 'pending' }),
      CleanerProfile.countDocuments({ approvalStatus: 'approved' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'completed' }),
      Booking.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ])
    ]);

    const avgRating = await CleanerProfile.aggregate([
      { $match: { approvalStatus: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalCleaners,
        pendingCleaners,
        approvedCleaners,
        totalBookings,
        completedBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        avgRating: avgRating[0]?.avgRating || 0
      }
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
});

module.exports = router;
