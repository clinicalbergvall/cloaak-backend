// Firebase Functions entry point
const { onRequest } = require("firebase-functions/v2/https");
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Initialize database connection for Firebase Functions
let dbConnection;

const connectDB = async () => {
  if (dbConnection) return dbConnection;
  
  try {
    dbConnection = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('✅ Firebase Functions MongoDB Connected');
    return dbConnection;
  } catch (err) {
    console.error('❌ MongoDB Connection Error in Firebase Functions:', err);
    throw err;
  }
};

// Create a separate app instance for Firebase Functions
const app = express();

// Apply middleware for Firebase Functions environment
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ success: false, message: 'Database connection error' });
  }
});

// Import your routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/cleaners', require('./routes/cleaners'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/team-leader', require('./routes/team-leader'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/events', require('./routes/events').router);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  res.json({ status: 'OK', message: 'Firebase Functions API is running' });
});

// Fallback for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Create and export the api Cloud Function
exports.api = onRequest(app);
