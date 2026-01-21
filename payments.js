
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Transaction = require('../models/transaction');
const User = require('../models/User');
const CleanerProfile = require('../models/CleanerProfile');
const IntaSend = require('intasend-node');
const { protect } = require('../middleware/auth');
const { sendNotificationToBookingParticipants, sendNotificationToUser } = require('./events');
let NotificationService;
try {
  NotificationService = require('../src/lib/notificationService');
  console.log('NotificationService loaded successfully in payments');
} catch (error) {
  console.warn('NotificationService not available in payments:', error.message);
  // Create a mock notification service to prevent crashes
  NotificationService = {
    sendPaymentCompletedNotification: async (bookingId, userId) => {
      console.warn(`NotificationService not available. Would send payment completed notification for booking ${bookingId} to user ${userId}`);
      return { success: false, message: 'NotificationService not available' };
    },
    sendPayoutProcessedNotification: async (bookingId, userId) => {
      console.warn(`NotificationService not available. Would send payout processed notification for booking ${bookingId} to user ${userId}`);
      return { success: false, message: 'NotificationService not available' };
    }
  };
}


router.post('/initiate', protect, async (req, res) => {
  console.log('Payment initiate route hit:', req.body);
  try {
    const { bookingId, phoneNumber } = req.body;
    
    
    const booking = await Booking.findOne({
      _id: bookingId,
      client: req.user.id,
      paymentStatus: 'pending'
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or already paid'
      });
    }
    
    
    // Validate IntaSend credentials
    if (!process.env.INTASEND_PUBLIC_KEY || !process.env.INTASEND_SECRET_KEY) {
      console.error('❌ IntaSend credentials not configured');
      return res.status(500).json({
        success: false,
        message: 'Payment service not configured. Please contact support.'
      });
    }
    
    const intasend = new IntaSend(
      process.env.INTASEND_PUBLIC_KEY,        
      process.env.INTASEND_SECRET_KEY,
      process.env.NODE_ENV !== 'production'
    );
    
    
    const formattedPhone = phoneNumber.replace(/^0/, '254').replace(/^\+/, '');
    
    // Recalculate pricing to ensure correct amount
    const pricing = booking.calculatePricing();
    
    const collection = intasend.collection();
    const response = await collection.mpesaStkPush({
      amount: pricing.totalPrice,
      phone_number: formattedPhone,
      api_ref: bookingId.toString(),
      callback_url: `${process.env.BACKEND_URL || 'https://clean-cloak-b.onrender.com'}/api/payments/webhook`,
      metadata: {
        booking_id: bookingId,
        client_id: req.user.id.toString(),
        service: booking.serviceCategory
      }
    });
    
    console.log('✅ STK Push initiated:', response);
    
    res.json({
      success: true,
      message: 'STK push sent. Check your phone.',
      paymentReference: response.invoice?.invoice_id || response.id,
      tracking_id: response.tracking_id
    });
    
  } catch (error) {
    console.error('❌ Payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.message
    });
  }
});


router.get('/status/:bookingId', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      client: req.user.id
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.json({
      success: true,
      paymentStatus: booking.paymentStatus,
      paid: booking.paid,
      paidAt: booking.paidAt,
      transactionId: booking.transactionId
    });
    
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status'
    });
  }
});


router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), 
  async (req, res) => {
    try {
      // Verify webhook signature if secret is configured
      if (process.env.INTASEND_WEBHOOK_SECRET) {
        const crypto = require('crypto');
        const signature = req.headers['x-intasend-signature'] || req.headers['signature'];
        
        if (signature) {
          const expectedSignature = crypto
            .createHmac('sha256', process.env.INTASEND_WEBHOOK_SECRET)
            .update(req.body)
            .digest('hex');
          
          // Use timing-safe comparison to prevent timing attacks
          if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            console.error('❌ Webhook signature verification failed');
            return res.status(401).json({ 
              success: false, 
              message: 'Invalid webhook signature' 
            });
          }
        } else {
          console.warn('⚠️ Webhook received without signature - accepting in development only');
          if (process.env.NODE_ENV === 'production') {
            return res.status(401).json({ 
              success: false, 
              message: 'Webhook signature required' 
            });
          }
        }
      } else {
        console.warn('⚠️ INTASEND_WEBHOOK_SECRET not set - webhook verification disabled');
        if (process.env.NODE_ENV === 'production') {
          console.error('❌ CRITICAL: Running in production without webhook secret!');
        }
      }
      
      const data = JSON.parse(req.body);

      
      if (data.status === 'COMPLETE') {
        const bookingId = data.metadata?.booking_id;

        
        if (!bookingId) {
          console.log('Webhook: No booking_id in metadata');
          return res.json({ success: true });
        }

        const booking = await Booking.findById(bookingId).populate('cleaner');

        // Check if payment already processed (idempotency)
        if (booking && booking.paid) {
          console.log(`Payment already processed for booking ${bookingId}`);
          return res.json({ success: true, message: 'Payment already processed' });
        }

        // Verify transaction ID hasn't been used before
        if (data.id || data.transaction_id) {
          const existingTransaction = await Transaction.findOne({
            transactionId: data.id || data.transaction_id,
            type: 'payment'
          });
          
          if (existingTransaction) {
            console.log(`Duplicate transaction detected: ${data.id || data.transaction_id}`);
            return res.json({ success: true, message: 'Transaction already processed' });
          }
        }

        if (booking && !booking.paid) {
          
          const pricing = booking.calculatePricing();
          
          // Verify payment amount matches booking price
          const paymentAmount = parseFloat(data.amount || data.value || 0);
          const expectedAmount = pricing.totalPrice;
          
          if (Math.abs(paymentAmount - expectedAmount) > 1) { // Allow 1 KES difference for rounding
            console.error(`❌ Payment amount mismatch: received ${paymentAmount}, expected ${expectedAmount} for booking ${bookingId}`);
            return res.status(400).json({
              success: false,
              message: `Payment amount mismatch. Expected ${expectedAmount}, received ${paymentAmount}`
            });
          }
          
          // Use MongoDB transaction for atomicity
          const session = await mongoose.startSession();
          session.startTransaction();
          
          try {
            booking.paid = true;
            booking.paidAt = new Date();
            booking.paymentStatus = 'paid';
            booking.transactionId = data.id || data.transaction_id || '';
            await booking.save({ session });

            const paymentTransaction = new Transaction({
              booking: booking._id,
              client: booking.client,
              cleaner: booking.cleaner,
              type: 'payment',
              amount: pricing.totalPrice,
              paymentMethod: booking.paymentMethod,
              transactionId: data.id || data.transaction_id || '',
              reference: `JOB_${booking._id}`,
              description: `Payment for cleaning service - ${booking.serviceCategory}`,
              status: 'completed',
              processedAt: new Date(),
              metadata: {
                intasendData: data,
                split: {
                  platformFee: pricing.platformFee,
                  cleanerPayout: pricing.cleanerPayout
                }
              }
            });
            await paymentTransaction.save({ session });

            // Only process payout if cleaner is assigned
            if (booking.cleaner) {
              await processCleanerPayout(booking, pricing.cleanerPayout, session);
            } else {
              console.warn(`⚠️ Payment received for booking ${bookingId} but no cleaner assigned yet`);
            }

            // Commit transaction
            await session.commitTransaction();
            session.endSession();

            // Send notifications after successful transaction
            sendNotificationToBookingParticipants(bookingId, 'payment_completed', {
              bookingId: bookingId,
              amount: pricing.totalPrice
            });
            
            try {
              if (NotificationService && typeof NotificationService.sendPaymentCompletedNotification === 'function') {
                await NotificationService.sendPaymentCompletedNotification(bookingId, booking.client);
                if (booking.cleaner) {
                  await NotificationService.sendPaymentCompletedNotification(bookingId, booking.cleaner);
                }
              }
            } catch (error) {
              console.warn('Failed to send payment completed notification:', error.message);
            }

            console.log(`Payment SUCCESS: KSh ${pricing.totalPrice} for JOB_${bookingId}`);
            console.log(`Platform fee (60%): KSh ${pricing.platformFee}`);
            console.log(`Cleaner payout (40%): KSh ${pricing.cleanerPayout}`);
          } catch (error) {
            // Rollback transaction on error
            await session.abortTransaction();
            session.endSession();
            console.error('❌ Payment processing transaction failed:', error);
            throw error;
          }
        } else if (booking?.paid) {
          console.log(`Payment already processed for JOB_${bookingId}`);
        }
      }

      
      res.json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ success: false });
    }
  }
);


async function processCleanerPayout(booking, payoutAmount, session = null) {
  try {
    // Check if cleaner is assigned
    if (!booking.cleaner) {
      console.warn(`⚠️ Cannot process payout for booking ${booking._id} - no cleaner assigned yet`);
      return; // Silently return, don't throw error
    }
    
    const cleanerProfile = await CleanerProfile.findOne({ user: booking.cleaner });
    
    if (!cleanerProfile) {
      throw new Error('Cleaner profile not found');
    }

    
    if (!cleanerProfile.mpesaPhoneNumber) {
      throw new Error('Cleaner M-Pesa phone number not configured');
    }

    
    const payoutTransaction = new Transaction({
      booking: booking._id,
      client: booking.client,
      cleaner: booking.cleaner,
      type: 'payout',
      amount: payoutAmount,
      paymentMethod: 'mpesa',
      transactionId: `PAYOUT_${Date.now()}_${booking._id}`,
      reference: `CLEANER_PAYOUT_JOB_${booking._id}`,
      description: `Cleaner payout for cleaning service - ${booking.serviceCategory}`,
      status: 'pending',
      metadata: {
        mpesaPhone: cleanerProfile.mpesaPhoneNumber
      }
    });
    
    if (session) {
      await payoutTransaction.save({ session });
    } else {
      await payoutTransaction.save();
    }
    
    
    booking.payoutStatus = 'pending';
    if (session) {
      await booking.save({ session });
    } else {
      await booking.save();
    }
    
    
    // Process payout outside transaction (IntaSend API call)
    // If this fails, we'll handle it separately
    try {
      await processMpesaPayout(payoutTransaction, cleanerProfile.mpesaPhoneNumber, payoutAmount);
    } catch (payoutError) {
      // Log error but don't fail the payment transaction
      console.error('Payout processing failed, but payment was successful:', payoutError);
      // Payout will be retried later via admin dashboard
    }
    
  } catch (error) {
    console.error('Error processing cleaner payout:', error);
    
    
    const failedTransaction = new Transaction({
      booking: booking._id,
      client: booking.client,
      cleaner: booking.cleaner,
      type: 'payout',
      amount: payoutAmount,
      paymentMethod: 'mpesa',
      transactionId: `FAILED_PAYOUT_${Date.now()}_${booking._id}`,
      reference: `FAILED_CLEANER_PAYOUT_JOB_${booking._id}`,
      description: `Failed cleaner payout for cleaning service - ${booking.serviceCategory}`,
      status: 'failed',
      metadata: {
        error: error.message,
        originalAmount: payoutAmount
      }
    });
    
    await failedTransaction.save();
    
    booking.payoutStatus = 'failed';
    await booking.save();
  }
}


async function processMpesaPayout(transaction, phoneNumber, amount) {
  try {
    
    const client = new IntaSend(
      process.env.INTASEND_PUBLIC_KEY,  
      process.env.INTASEND_SECRET_KEY,
      process.env.NODE_ENV !== 'production'   
    );

    const response = await client.transfer().mpesa({
      amount: amount,
      account: phoneNumber,
      narrative: `Cleaner payout for ${transaction.reference}`,
    });

    if (response.success) {
      
      transaction.status = 'completed';
      transaction.processedAt = new Date();
      transaction.transactionId = response.id;
      transaction.metadata.intasendResponse = response;
      await transaction.save();

      
      const booking = await Booking.findById(transaction.booking);
      booking.payoutStatus = 'processed';
      booking.payoutProcessedAt = new Date();
      await booking.save();
      
      
      sendNotificationToUser(booking.cleaner, 'payout_processed', {
        bookingId: booking._id,
        amount: transaction.amount
      });
      
      
      try {
        if (NotificationService && typeof NotificationService.sendPayoutProcessedNotification === 'function') {
          await NotificationService.sendPayoutProcessedNotification(booking._id, booking.cleaner);
        }
      } catch (error) {
        console.warn('Failed to send payout processed notification:', error.message);
      }

      console.log(`M-Pesa payout SUCCESS: KSh ${amount} to ${phoneNumber}`);
    } else {
      throw new Error(response.message || 'M-Pesa payout failed');
    }

  } catch (error) {
    console.error('M-Pesa payout error:', error);
    
    
    transaction.status = 'failed';
    transaction.metadata.error = error.message;
    await transaction.save();

    
    const booking = await Booking.findById(transaction.booking);
    booking.payoutStatus = 'failed';
    await booking.save();
    
    throw error;
  }
}


router.post('/retry/:bookingId', protect, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      client: req.user.id,
      paymentStatus: 'pending'
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or already paid'
      });
    }
    
    
    // Validate IntaSend credentials
    if (!process.env.INTASEND_PUBLIC_KEY || !process.env.INTASEND_SECRET_KEY) {
      console.error('❌ IntaSend credentials not configured');
      return res.status(500).json({
        success: false,
        message: 'Payment service not configured. Please contact support.'
      });
    }
    
    const intasend = new IntaSend(
      process.env.INTASEND_PUBLIC_KEY,        
      process.env.INTASEND_SECRET_KEY,
      process.env.NODE_ENV !== 'production'
    );
    
    
    const formattedPhone = phoneNumber.replace(/^0/, '254').replace(/^\+/, '');
    
    // Recalculate pricing to ensure correct amount
    const pricing = booking.calculatePricing();
    
    const collection = intasend.collection();
    const response = await collection.mpesaStkPush({
      amount: pricing.totalPrice,
      phone_number: formattedPhone,
      api_ref: booking._id.toString(),
      callback_url: `${process.env.BACKEND_URL || 'https://clean-cloak-b.onrender.com'}/api/payments/webhook`,
      metadata: {
        booking_id: booking._id.toString(),
        client_id: req.user.id.toString(),
        service: booking.serviceCategory
      }
    });
    
    console.log('✅ STK Push retried:', response);
    
    res.json({
      success: true,
      message: 'STK push resent. Check your phone.',
      paymentReference: response.invoice?.invoice_id || response.id,
      tracking_id: response.tracking_id
    });
    
  } catch (error) {
    console.error('❌ Payment retry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry payment',
      error: error.message
    });
  }
});

module.exports = router;