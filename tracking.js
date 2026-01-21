const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Tracking = require('../models/Tracking');
const Booking = require('../models/Booking');
const { sendNotificationToUser } = require('./events');




router.post('/', protect, authorize('cleaner'), async (req, res) => {
  try {
    const { bookingId, latitude, longitude, address } = req.body;

    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.cleaner?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to track this booking'
      });
    }

    
    let tracking = await Tracking.findOne({ booking: bookingId });
    
    if (tracking) {
      tracking.currentLocation = { latitude, longitude, address };
      tracking.locationHistory.push({ latitude, longitude });
      await tracking.save();
    } else {
      tracking = await Tracking.create({
        booking: bookingId,
        cleaner: req.user.id,
        currentLocation: { latitude, longitude, address },
        locationHistory: [{ latitude, longitude }]
      });
    }

    res.json({
      success: true,
      tracking
    });
  } catch (error) {
    console.error('Start tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting tracking'
    });
  }
});




router.get('/:bookingId', protect, async (req, res) => {
  try {
    const tracking = await Tracking.findOne({ booking: req.params.bookingId })
      .populate('cleaner', 'name phone profileImage');

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Tracking not found'
      });
    }

    
    const booking = await Booking.findById(req.params.bookingId);
    if (booking.client.toString() !== req.user.id && 
        booking.cleaner?.toString() !== req.user.id &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this tracking'
      });
    }

    res.json({
      success: true,
      tracking
    });
  } catch (error) {
    console.error('Get tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tracking data'
    });
  }
});




router.put('/:bookingId/location', protect, authorize('cleaner'), async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    const tracking = await Tracking.findOne({ booking: req.params.bookingId });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Tracking not found'
      });
    }

    if (tracking.cleaner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    tracking.currentLocation = { latitude, longitude, address };
    tracking.locationHistory.push({ latitude, longitude });
    await tracking.save();

    res.json({
      success: true,
      tracking
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location'
    });
  }
});




router.put('/:bookingId/status', protect, authorize('cleaner'), async (req, res) => {
  try {
    const { status, estimatedArrival } = req.body;

    const tracking = await Tracking.findOne({ booking: req.params.bookingId });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Tracking not found'
      });
    }

    if (tracking.cleaner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    tracking.status = status;
    if (estimatedArrival) {
      tracking.estimatedArrival = estimatedArrival;
    }
    await tracking.save();
    
    
    const booking = await Booking.findById(req.params.bookingId);
    if (booking && booking.client) {
      sendNotificationToUser(booking.client, 'cleaner_status_update', {
        bookingId: req.params.bookingId,
        status: status,
        estimatedArrival: estimatedArrival
      });
    }

    res.json({
      success: true,
      tracking
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status'
    });
  }
});

module.exports = router;
