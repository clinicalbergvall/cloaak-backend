const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');
const ChatRoom = require('../models/ChatRoom');
const { sendNotification: sendSocketNotification } = require('../lib/socket');


const clients = new Map();




router.get('/', protect, (req, res) => {

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });


  const clientId = req.user.id;
  clients.set(clientId, res);

  console.log(`📱 SSE client connected: ${clientId} (${req.user.role})`);


  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to notification stream' })}\n\n`);


  const heartbeatInterval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
  }, 30000);


  req.on('close', () => {
    clearInterval(heartbeatInterval);
    clients.delete(clientId);
    console.log(`📱 SSE client disconnected: ${clientId}`);
  });


  req.on('error', (err) => {
    console.error(`❌ SSE error for client ${clientId}:`, err);
    clearInterval(heartbeatInterval);
    clients.delete(clientId);
  });
});


const sendNotificationToUser = (userId, eventType, payload) => {

  sendSocketNotification(userId.toString(), eventType, payload);


  const client = clients.get(userId.toString());
  if (client) {
    try {
      client.write(`data: ${JSON.stringify({ type: eventType, payload })}\n\n`);
      console.log(`📤 SSE Notification sent to user ${userId}: ${eventType}`);
    } catch (err) {
      console.error(`❌ Failed to send SSE notification to user ${userId}:`, err);
      clients.delete(userId.toString());
    }
  }
};


const sendNotificationToBookingParticipants = async (bookingId, eventType, payload) => {
  try {
    const booking = await Booking.findById(bookingId).select('client cleaner');
    if (booking) {

      sendNotificationToUser(booking.client, eventType, { ...payload, bookingId });


      if (booking.cleaner) {
        sendNotificationToUser(booking.cleaner, eventType, { ...payload, bookingId });
      }
    }
  } catch (err) {
    console.error('❌ Error sending booking notification:', err);
  }
};


module.exports = {
  router,
  sendNotificationToUser,
  sendNotificationToBookingParticipants
};