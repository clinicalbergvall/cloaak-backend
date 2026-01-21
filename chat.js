const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ChatRoom = require('../models/ChatRoom');
const Booking = require('../models/Booking');
const { sendNotificationToUser } = require('./events');

// Simple sanitization function for server-side
function sanitizeMessage(message) {
  if (!message || typeof message !== 'string') {
    return '';
  }
  // Remove HTML tags
  let sanitized = message.replace(/<[^>]*>/g, '');
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  // Limit length
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  return sanitized.trim();
}




router.post('/', protect, async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if cleaner is assigned before creating chat room
    if (!booking.cleaner) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create chat room - no cleaner assigned to this booking yet'
      });
    }

    
    let chatRoom = await ChatRoom.findOne({ booking: bookingId });
    
    if (chatRoom) {
      return res.json({
        success: true,
        chatRoom
      });
    }

    
    chatRoom = await ChatRoom.create({
      booking: bookingId,
      client: booking.client,
      cleaner: booking.cleaner
    });

    res.status(201).json({
      success: true,
      chatRoom
    });
  } catch (error) {
    console.error('Create chat room error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chat room'
    });
  }
});




router.get('/:bookingId', protect, async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findOne({ booking: req.params.bookingId })
      .populate('client', 'name phone profileImage')
      .populate('cleaner', 'name phone profileImage')
      .populate('messages.sender', 'name phone');

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    
    if (chatRoom.client._id.toString() !== req.user.id && 
        chatRoom.cleaner._id.toString() !== req.user.id &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this chat'
      });
    }

    
    const userRole = chatRoom.client._id.toString() === req.user.id ? 'client' : 'cleaner';
    await chatRoom.markAsRead(userRole);

    res.json({
      success: true,
      chatRoom
    });
  } catch (error) {
    console.error('Get chat room error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat room'
    });
  }
});




router.post('/:bookingId/message', protect, async (req, res) => {
  try {
    let { message } = req.body;
    
    // Sanitize message input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a string'
      });
    }
    
    message = sanitizeMessage(message);
    
    if (!message || message.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    const chatRoom = await ChatRoom.findOne({ booking: req.params.bookingId });

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    
    if (chatRoom.client.toString() !== req.user.id && 
        chatRoom.cleaner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this chat'
      });
    }

    
    const senderRole = chatRoom.client.toString() === req.user.id ? 'client' : 'cleaner';

    
    await chatRoom.addMessage(req.user.id, senderRole, message);
    
    
    const recipientId = senderRole === 'client' ? chatRoom.cleaner : chatRoom.client;
    const senderName = senderRole === 'client' ? 'Client' : 'Cleaner';
    
    sendNotificationToUser(recipientId, 'newMessage', {
      message: {
        text: message,
        senderName: senderName
      },
      bookingId: req.params.bookingId
    });

    
    const updatedChatRoom = await ChatRoom.findOne({ booking: req.params.bookingId })
      .populate('client', 'name phone profileImage')
      .populate('cleaner', 'name phone profileImage')
      .populate('messages.sender', 'name phone');
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {  
        ...updatedChatRoom.messages[updatedChatRoom.messages.length - 1],
        id: updatedChatRoom.messages[updatedChatRoom.messages.length - 1]._id,
        bookingId: req.params.bookingId,
        senderId: updatedChatRoom.messages[updatedChatRoom.messages.length - 1].sender._id,
        senderName: updatedChatRoom.messages[updatedChatRoom.messages.length - 1].sender.name,
        senderRole: updatedChatRoom.messages[updatedChatRoom.messages.length - 1].senderRole,
        message: updatedChatRoom.messages[updatedChatRoom.messages.length - 1].message,
        timestamp: updatedChatRoom.messages[updatedChatRoom.messages.length - 1].timestamp,
        read: updatedChatRoom.messages[updatedChatRoom.messages.length - 1].readByClient,
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
});




router.get('/', protect, async (req, res) => {
  try {
    const query = {
      $or: [
        { client: req.user.id },
        { cleaner: req.user.id }
      ],
      active: true
    };

    const chatRooms = await ChatRoom.find(query)
      .populate('client', 'name phone profileImage')
      .populate('cleaner', 'name phone profileImage')
      .populate('booking', 'serviceCategory status')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: chatRooms.length,
      chatRooms
    });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat rooms'
    });
  }
});

module.exports = router;
