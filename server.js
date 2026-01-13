const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const serverless = require('serverless-http');
let cookieParser;


dotenv.config();


const app = express();
app.set('trust proxy', true);


app.use(helmet());
app.use(compression());


const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,

  skip: (req, res) => req.path === '/api/health'
});
app.use('/api/', limiter);


// Custom rate limiter for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 140,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/', authLimiter);


app.use((req, res, next) => {
  res.setTimeout(25000, () => {
    console.error('Request timeout:', req.url);
    res.status(408).json({
      success: false,
      message: 'Request timeout'
    });
  });
  next();
});

// Additional CORS handling for development
app.use((req, res, next) => {
  // Allow cross-origin requests during development
  if (process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Client-Type, X-HTTP-Method-Override');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
  }
  next();
});


if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}


// Apply CORS middleware before rate limiting and other middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Capacitor, or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins when NODE_ENV is not set to production (for local development)
    // This covers development, local testing, and any non-production environment
    if (process.env.NODE_ENV !== 'production') {
      console.log('Non-production environment detected, allowing all origins');
      return callback(null, true);
    }
    
    // For production, you should specify your frontend domains
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost:8000',
      'http://localhost:5174', // Current dev server port
      'https://clean-cloak-b.onrender.com',
      'https://teal-daffodil-d3a9b2.netlify.app',
      'https://your-deployed-frontend.com', // Add your actual deployed frontend URL
      'ionic://localhost',
      'capacitor://localhost',
      'http://localhost',
      'http://localhost:*',
      'capacitor*',
      'file://',
      'data:',
      'chrome',
      'chrome-extension://'
    ];
    
    // Check if the origin matches any of the allowed origins
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // Handle wildcard patterns
        const regexPattern = '^' + allowedOrigin.replace(/\*/g, '.*') + '$';
        return new RegExp(regexPattern).test(origin);
      }
      return origin === allowedOrigin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Client-Type', 'X-Requested-With', 'X-HTTP-Method-Override']
};
app.use(cors(corsOptions));

// The CORS middleware should handle preflight requests automatically

// Initialize Firebase Admin SDK for push notifications
let NotificationService;
try {
  NotificationService = require('./lib/notificationService');
  console.log('✅ NotificationService loaded successfully');
} catch (error) {
  console.warn('⚠️ NotificationService not available:', error.message);
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


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


try {
  cookieParser = require('cookie-parser');
  app.use(cookieParser());
} catch (e) {
  console.warn('cookie-parser not installed; falling back to manual parsing in auth middleware');
}


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  // Check if MONGODB_URI is available
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI environment variable not set. Database functionality will be limited.');
    // Return a mock connection object for development without database
    cachedDb = {
      connection: { readyState: 0 }, // 0 = disconnected
      models: {},
      model: (name, schema) => ({})
    };
    return cachedDb;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    cachedDb = conn;
    console.log('✅ MongoDB Connected Successfully');
    console.log(`🔗 Connected to database: ${process.env.MONGODB_URI}`);
    return conn;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    console.error('🔧 For development, make sure MongoDB is installed and running, or set MONGODB_URI');
    
    // Create a mock connection object to allow the server to start
    console.warn('⚠️ Using mock database connection - features will be limited');
    cachedDb = {
      connection: { readyState: 0 }, // 0 = disconnected
      models: {},
      model: (name, schema) => ({
        // Mock model methods for basic functionality
        findOne: async () => null,
        findById: async () => null,
        create: async () => null,
        save: async () => null,
        updateOne: async () => null,
        deleteOne: async () => null
      })
    };
    return cachedDb;
  }
}


process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});


connectToDatabase().then(async () => {
  console.log('Database connected, checking for admin user...');
  
  // Dynamically import User model after database connection
  const User = require('./models/User');
  
  try {
    // Check if admin user exists
    const adminPhone = '0777777777'; // Default admin phone
    const existingAdmin = await User.findOne({ role: 'admin', phone: adminPhone });
    
    if (!existingAdmin) {
      console.log('No admin user found, creating default admin...');
      
      // Create a default admin user
      const adminUser = new User({
        name: 'Admin User',
        phone: adminPhone,
        password: 'cloak123', // Default password - change after first login
        role: 'admin',
        isVerified: true,
        verificationStatus: 'verified'
      });
      
      await adminUser.save();
      console.log('✅ Default admin user created successfully!');
      console.log('📱 Admin phone:', adminUser.phone);
      console.log('🔐 Default password: cloak123 (CHANGE IMMEDIATELY after first login)');
    } else {
      console.log('✅ Admin user already exists, skipping creation');
    }
  } catch (error) {
    if (error.code === 11000 && error.keyValue && error.keyValue.phone === '0777777777') {
      console.log('✅ Admin user already exists, skipping creation (duplicate key error)');
    } else {
      console.error('Error during admin creation check:', error);
    }
  }
}).catch(err => {
  console.error('Failed to initialize database connection:', err);
});


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

// Previously had routing conflicts due to improper API route handling
// Now using more specific API detection to prevent HTML responses for API calls


app.get('/api/health', async (req, res) => {
  try {

    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const health = {
      status: 'OK',
      message: 'CleanCloak API is running',
      timestamp: new Date().toISOString(),
      database: {
        state: dbStates[dbState],
        healthy: dbState === 1
      },
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      }
    };

    if (dbState !== 1) {
      health.status = 'WARNING';
      health.message = 'Database connection issue';
    }

    res.status(dbState === 1 ? 200 : 503).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});


if (process.env.NODE_ENV === 'production') {
  // Serve static files but exclude API routes
  app.use(/^((?!\/api\/).)*$/, express.static(path.join(__dirname, 'dist')));

  // Serve frontend app for web browser navigation requests that don't match static files
  // This should be registered last, after all API routes
  app.get(/^((?!\/api\/).)*$/, (req, res) => { // Handle all non-API routes
    // This route only matches non-API routes due to the regex pattern, so we can serve the frontend
    // This is a web browser navigation request, serve the frontend app
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}


app.use((err, req, res, next) => {
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    headers: req.headers,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent')
  });

  const statusCode = err.statusCode || err.status || 500;

  // Log the error in a way that helps us identify if it's related to HTML being served instead of JSON
  if (req.path.startsWith('/api/')) {
    console.error('API ERROR DETECTED:', {
      path: req.path,
      method: req.method,
      headers: req.headers,
      userAgent: req.get('User-Agent'),
      originalUrl: req.originalUrl
    });
  }

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  });
});


app.use((req, res) => {
  // Check if it's an API request (by path or headers)
  // Enhanced API request detection for mobile apps
  const isApiRequest = req.path.startsWith('/api/') ||
    req.headers['x-requested-with'] === 'XMLHttpRequest' ||
    req.headers.accept?.includes('application/json') ||
    req.headers['content-type']?.includes('application/json') ||
    req.headers['x-capacitor'] || // Explicit Capacitor header
    req.headers.origin === undefined || // Native requests may not have origin
    req.headers['user-agent']?.toLowerCase().includes('capacitor') ||
    req.headers['user-agent']?.toLowerCase().includes('mobile');
  
  if (isApiRequest) {
    console.log('API 404 handler hit:', req.method, req.url, 'Headers:', req.headers);
    // Extra logging to help debug the HTML response issue
    console.error('UNHANDLED API REQUEST:', {
      path: req.path,
      method: req.method,
      headers: req.headers,
      userAgent: req.get('User-Agent'),
      originalUrl: req.originalUrl
    });
    res.status(404).json({
      success: false,
      message: 'API route not found'
    });
  } else {
    // This is a web browser navigation request
    if (process.env.NODE_ENV === 'production') {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
      console.log('Non-API 404 handler hit:', req.method, req.url);
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
  }
});


process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});


const PORT = process.env.NODE_ENV === 'production' ? (process.env.PORT || 5000) : 5001;
const http = require('http');
const server = http.createServer(app);
const { initSocket } = require('./lib/socket.js');

initSocket(server);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'https://teal-daffodil-d3a9b2.netlify.app/'}`);
    console.log(`📡 Backend URL: http://localhost:${PORT}`);
    console.log('📋 Available routes:');
    console.log('   - Health check: GET /api/health');
    console.log('   - Auth: POST /api/auth/login, POST /api/auth/register');
    console.log('   - Cleaners: GET /api/cleaners');
  });
  
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please stop the other process or use a different port.`);
    }
  });
}

// Standard export for Render and other platforms
module.exports = { app, server };

// Conditional export for Vercel deployment
if (process.env.VERCEL) {
  module.exports.handler = serverless(app);
}