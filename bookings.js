const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { protect, authorize } = require("../middleware/auth");
const Booking = require("../models/Booking");
const CleanerProfile = require("../models/CleanerProfile");
const User = require("../models/User");
const IntaSend = require("intasend-node"); 
const { v4: uuidv4 } = require("uuid");
const { sendNotificationToUser, sendNotificationToBookingParticipants } = require('./events');
let NotificationService;
try {
  NotificationService = require('../lib/notificationService');
  console.log('NotificationService loaded successfully');
} catch (error) {
  console.warn('NotificationService not available:', error.message);
  // Create a mock notification service to prevent crashes
  NotificationService = {
    sendBookingCreatedNotification: async (bookingId, userId) => {
      console.warn(`NotificationService not available. Would send booking created notification for booking ${bookingId} to user ${userId}`);
      return { success: false, message: 'NotificationService not available' };
    },
    sendBookingAcceptedNotification: async (bookingId, userId) => {
      console.warn(`NotificationService not available. Would send booking accepted notification for booking ${bookingId} to user ${userId}`);
      return { success: false, message: 'NotificationService not available' };
    },
    sendBookingCompletedNotification: async (bookingId, userId) => {
      console.warn(`NotificationService not available. Would send booking completed notification for booking ${bookingId} to user ${userId}`);
      return { success: false, message: 'NotificationService not available' };
    },
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


const formatCurrency = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});




router.post("/public", async (req, res) => {
  try {
    const {
      contact,
      serviceCategory,
      
      vehicleType,
      carServicePackage,
      paintCorrectionStage,
      midSUVPricingTier,
      fleetCarCount,
      selectedCarExtras,
      
      cleaningCategory,
      houseCleaningType,
      fumigationType,
      roomSize,
      bathroomItems,
      windowCount,
      
      bookingType,
      scheduledDate,
      scheduledTime,
      paymentMethod,
      price,
      location,
      paymentStatus,
    } = req.body;

    if (!contact?.name || !contact?.phone) {
      return res.status(400).json({
        success: false,
        message: "Contact name and phone are required",
      });
    }

    if (
      !serviceCategory ||
      !bookingType ||
      !paymentMethod ||
      typeof price !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required booking details",
      });
    }

    if (
      serviceCategory === "car-detailing" &&
      (!vehicleType || !carServicePackage)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Vehicle type and service package are required for car detailing bookings",
      });
    }

    if (serviceCategory === "home-cleaning" && !cleaningCategory) {
      return res.status(400).json({
        success: false,
        message: "Cleaning category is required for home cleaning bookings",
      });
    }

    if (bookingType === "scheduled" && (!scheduledDate || !scheduledTime)) {
      return res.status(400).json({
        success: false,
        message: "Scheduled bookings must include date and time",
      });
    }

    let user = await User.findOne({
      phone: contact.phone,
    });

    if (!user) {
      const generatedPassword = crypto.randomBytes(8).toString("hex");
      user = await User.create({
        name: contact.name,
        phone: contact.phone,
        password: generatedPassword,
        role: "client",
      });
    }

    const bookingPayload = {
      serviceCategory,
      
      vehicleType,
      carServicePackage,
      paintCorrectionStage,
      midSUVPricingTier,
      fleetCarCount,
      selectedCarExtras,
      
      cleaningCategory,
      houseCleaningType,
      fumigationType,
      roomSize,
      bathroomItems,
      windowCount,
      
      bookingType,
      scheduledDate,
      scheduledTime,
      paymentMethod,
      price,
      location,
      paymentStatus: paymentStatus || "pending",
      client: user._id,
    };

    const booking = await Booking.create(bookingPayload);

    try {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "7d",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    } catch (e) {
      console.error("Auto-login cookie set failed:", e);
    }

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role },
    });
    
    
    sendNotificationToUser(user._id, 'booking_created', {
      serviceCategory: bookingPayload.serviceCategory,
      bookingId: booking._id
    });
    
    
    try {
      if (NotificationService && typeof NotificationService.sendBookingCreatedNotification === 'function') {
        await NotificationService.sendBookingCreatedNotification(booking._id, user._id);
      }
    } catch (error) {
      console.warn('Failed to send booking created notification:', error.message);
    }
  } catch (error) {
    console.error("Public booking creation error:", error);
    // Sanitize error message to prevent data leaks
    let errorMessage = "Error creating booking";
    if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message).substring(0, 200);
    } else if (typeof error === 'string') {
      errorMessage = error.substring(0, 200);
    }
    res.status(500).json({
      success: false,
      message: "Error creating booking",
      error: errorMessage,
    });
  }
});




router.post("/", protect, async (req, res) => {
  try {
    // Sanitize input before creating booking
    const sanitizedBody = sanitizeBookingInput(req.body);
    
    const bookingData = {
      ...sanitizedBody,
      client: req.user.id,
    };

    const booking = await Booking.create(bookingData);

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
    
    
    sendNotificationToUser(req.user.id, 'booking_created', {
      serviceCategory: bookingData.serviceCategory,
      bookingId: booking._id
    });
    
    
    try {
      if (NotificationService && typeof NotificationService.sendBookingCreatedNotification === 'function') {
        await NotificationService.sendBookingCreatedNotification(booking._id, req.user.id);
      }
    } catch (error) {
      console.warn('Failed to send booking created notification:', error.message);
    }
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating booking",
      error: error.message,
    });
  }
});




router.get("/", protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "client") {
      query.client = req.user.id;
    } else if (req.user.role === "cleaner") {
      query.cleaner = req.user.id;
    }

    const bookings = await Booking.find(query)
      .populate("client", "name phone email")
      .populate("cleaner", "name phone email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
    });
  }
});




router.get(
  "/opportunities",
  protect,
  authorize("cleaner"),
  async (req, res) => {
    try {
      const {
        serviceCategory = "car-detailing",
        statuses,
        limit = 25,
        page = 1,
      } = req.query;

      const statusList =
        typeof statuses === "string" && statuses.length
          ? statuses
              .split(",")
              .map((status) => status.trim())
              .filter(Boolean)
          : ["pending", "confirmed"];

      const pageSize = Math.min(Number(limit) || 25, 100);
      const pageNumber = Math.max(Number(page) || 1, 1);
      const skip = (pageNumber - 1) * pageSize;

      const query = {
        serviceCategory,
        cleaner: null,
      };

      if (statusList.length) {
        query.status = { $in: statusList };
      }

      const [bookings, total] = await Promise.all([
        Booking.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .select(
            "serviceCategory bookingType status price vehicleType carServiceOption carServicePackage cleaningCategory location scheduledDate scheduledTime createdAt",
          ),
        Booking.countDocuments(query),
      ]);

      const currencyFormatter = new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        maximumFractionDigits: 0,
      });

      const carServiceLabels = {
        
        INTERIOR: "Interior Detail",
        EXTERIOR: "Exterior Detail",
        PAINT: "Paint Correction",
        FULL: "Full Detail",
        
        "NORMAL-DETAIL": "Normal Detail",
        "INTERIOR-STEAMING": "Interior Steaming",
        "PAINT-CORRECTION": "Paint Correction",
        "FULL-DETAIL": "Full Detail",
        "FLEET-PACKAGE": "Fleet Package",
      };

      const opportunities = bookings.map((booking) => {
        const pkg = booking.carServicePackage || booking.carServiceOption;
        const title =
          booking.serviceCategory === "car-detailing"
            ? [carServiceLabels[pkg] || pkg || "Car Detailing", booking.vehicleType]
                .filter(Boolean)
                .join(" · ")
            : [booking.cleaningCategory || "Home Cleaning"].filter(Boolean).join(" · ");

        const timing =
          booking.bookingType === "scheduled" && booking.scheduledDate
            ? `${booking.scheduledDate}${booking.scheduledTime ? ` · ${booking.scheduledTime}` : ""}`
            : "Immediate dispatch";

        const requirements = [
          booking.vehicleType ? `Vehicle: ${booking.vehicleType}` : null,
          booking.carServiceOption
            ? `Package: ${booking.carServiceOption}`
            : null,
          `Status: ${booking.status}`,
        ].filter(Boolean);

        return {
          id: booking._id.toString(),
          bookingId: booking._id.toString(),
          title,
          location:
            booking.location?.manualAddress ||
            booking.location?.address ||
            "Client to confirm exact location",
          coordinates: booking.location?.coordinates,
          payout: currencyFormatter.format(booking.price || 0),
          timing,
          requirements,
          serviceCategory: booking.serviceCategory,
          priority: booking.price >= 15000 ? "featured" : "standard",
          saved: false,
          createdAt:
            booking.createdAt?.toISOString?.() || new Date().toISOString(),
        };
      });

      res.json({
        success: true,
        count: opportunities.length,
        total,
        page: pageNumber,
        pageSize,
        opportunities,
      });
    } catch (error) {
      console.error("Fetch opportunities error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching booking opportunities",
      });
    }
  },
);




router.post("/:id/accept", protect, authorize("cleaner"), async (req, res) => {
  try {
    // Use atomic operation to prevent race condition
    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        cleaner: null, // Only match if no cleaner assigned
        status: "pending" // Only match if status is pending
      },
      {
        $set: {
          cleaner: req.user.id,
          status: "confirmed",
          acceptedAt: new Date()
        }
      },
      {
        new: true, // Return updated document
        runValidators: true
      }
    ).populate("client", "name phone email");

    if (!booking) {
      // Try to find booking to give better error message
      const existingBooking = await Booking.findById(req.params.id);
      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }
      
      if (existingBooking.cleaner) {
        return res.status(400).json({
          success: false,
          message: "This booking has already been accepted by another cleaner",
        });
      }
      
      if (existingBooking.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "This booking is no longer available",
        });
      }
      
      // If we get here, something else went wrong
      return res.status(409).json({
        success: false,
        message: "Booking was just accepted by another cleaner. Please try a different booking.",
      });
    }

    
    await booking.populate("cleaner", "name phone email");

    console.log(`✅ Booking ${booking._id} accepted by cleaner ${req.user.id}`);

    
    sendNotificationToUser(booking.client._id, 'booking_accepted', {
      bookingId: booking._id
    });
    
    
    try {
      if (NotificationService && typeof NotificationService.sendBookingAcceptedNotification === 'function') {
        await NotificationService.sendBookingAcceptedNotification(booking._id, booking.client._id);
      }
    } catch (error) {
      console.warn('Failed to send booking accepted notification:', error.message);
    }

    res.json({
      success: true,
      message: "Booking accepted successfully! Client has been notified.",
      booking,
    });
  } catch (error) {
    console.error("Accept booking error:", error);
    const { getUserFriendlyError } = require('../src/lib/errorHandler');
    res.status(500).json({
      success: false,
      message: "Error accepting booking",
      error: getUserFriendlyError(error),
    });
  }
});




router.get("/:id", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("client", "name phone email")
      .populate("cleaner", "name phone email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (
      booking.client._id.toString() !== req.user.id &&
      booking.cleaner?._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this booking",
      });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Fetch booking error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching booking",
    });
  }
});




router.post("/:id/pay", protect, authorize("client"), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("client", "phone")
      .populate("cleaner", "phone");

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    
    if (booking.client._id.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (booking.status !== "confirmed") {
      return res
        .status(400)
        .json({ success: false, message: "Booking must be confirmed first" });
    }

    if (booking.paid) {
      return res.status(400).json({ success: false, message: "Already paid" });
    }

    // Validate cleaner is assigned
    if (!booking.cleaner) {
      return res.status(400).json({
        success: false,
        message: "Cannot pay for booking - no cleaner assigned yet. Please wait for a cleaner to accept the booking.",
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
    
    const client = new IntaSend(
      process.env.INTASEND_PUBLIC_KEY,  
      process.env.INTASEND_SECRET_KEY,
      process.env.NODE_ENV !== "production", 
    );

    
    const pricing = booking.calculatePricing();

    
    booking.totalPrice = pricing.totalPrice;
    booking.platformFee = pricing.platformFee;
    booking.cleanerPayout = pricing.cleanerPayout;
    await booking.save();

    // Get cleaner phone number safely (already populated)
    const cleanerPhone = booking.cleaner?.phone || null;

    const response = await client.collection().stkPush({
      amount: pricing.totalPrice,
      phone: booking.client.phone,
      reference: `JOB_${booking._id}`,
      description: `Cleaning Job #${booking._id}`,
      callback_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
      metadata: {
        booking_id: booking._id.toString(),
        split: {
          cleaner_phone: cleanerPhone,
          percentage: 40, 
          platform_fee: pricing.platformFee,
          cleaner_payout: pricing.cleanerPayout,
        },
      },
    });

    res.json({
      success: true,
      message: "STK Push sent – check your phone",
      checkout_id: response.id,
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start payment",
      error: error.message,
    });
  }
});




router.put(
  "/:id/status",
  protect,
  authorize("cleaner", "admin"),
  async (req, res) => {
    try {
      const { status } = req.body;
      if (status === "cancelled") {
        return res
          .status(400)
          .json({ success: false, message: "Cancellation disabled" });
      }
      const booking = await Booking.findById(req.params.id);
      if (!booking)
        return res.status(404).json({ success: false, message: "Not found" });

      if (
        req.user.role === "cleaner" &&
        booking.cleaner?.toString() !== req.user.id
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
      }

      booking.status = status;
      
      // Handle notes if provided - sanitize input
      if (req.body.notes !== undefined) {
        let notes = req.body.notes;
        if (typeof notes === 'string') {
          // Sanitize notes: remove HTML tags and dangerous content
          notes = notes.replace(/<[^>]*>/g, '');
          notes = notes.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
          notes = notes.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
          notes = notes.replace(/javascript:/gi, '');
          if (notes.length > 500) {
            notes = notes.substring(0, 500);
          }
        }
        booking.completionNotes = notes;
      }
      
      if (status === "completed") {
        booking.completedAt = new Date();
        
        sendNotificationToBookingParticipants(booking._id, 'booking_completed', {
          bookingId: booking._id
        });
        
        
        try {
          if (NotificationService && typeof NotificationService.sendBookingCompletedNotification === 'function') {
            await NotificationService.sendBookingCompletedNotification(booking._id, booking.client._id);
            if (booking.cleaner) {
              await NotificationService.sendBookingCompletedNotification(booking._id, booking.cleaner._id);
            }
          }
        } catch (error) {
          console.warn('Failed to send booking completed notification:', error.message);
        }
      }
      await booking.save();

      res.json({ success: true, message: "Status updated", booking });
    } catch (error) {
      res.status(500).json({ success: false, message: "Update failed" });
    }
  },
);





const rateBookingHandler = async (req, res) => {
  try {
    let { rating, review } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res.status(404).json({ success: false, message: "Not found" });

    if (booking.client.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (booking.status !== "completed") {
      return res
        .status(400)
        .json({ success: false, message: "Must be completed" });
    }

    // Validate and sanitize rating
    if (rating && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5"
      });
    }

    // Sanitize review text
    if (review && typeof review === 'string') {
      review = review.replace(/<[^>]*>/g, '');
      review = review.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      review = review.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
      review = review.replace(/javascript:/gi, '');
      if (review.length > 500) {
        review = review.substring(0, 500);
      }
    }

    // Validate and sanitize rating
    if (rating && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5"
      });
    }

    // Sanitize review text
    if (review && typeof review === 'string') {
      review = review.replace(/<[^>]*>/g, '');
      review = review.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      review = review.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
      review = review.replace(/javascript:/gi, '');
      if (review.length > 500) {
        review = review.substring(0, 500);
      }
    }

    booking.rating = rating;
    booking.review = review || "";
    await booking.save();

    if (booking.cleaner) {
      const profile = await CleanerProfile.findOne({ user: booking.cleaner });
      if (profile) await profile.updateRating(rating);
    }

    res.json({ success: true, message: "Rating saved", booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Rating failed" });
  }
};


router.put("/:id/rating", protect, authorize("client"), rateBookingHandler);
router.post("/:id/rating", protect, authorize("client"), rateBookingHandler);

 






module.exports = router;
