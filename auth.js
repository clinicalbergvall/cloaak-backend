const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const router = express.Router();

// Function to generate JWT token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required. Application cannot start without it.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// Registration route
router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("phone")
      .matches(/^0[17]\d{8}$/)
      .withMessage("Please provide a valid Kenyan phone number"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .optional()
      .isIn(["client", "cleaner", "team_leader", "admin"])
      .withMessage("Role must be client, cleaner, team_leader, or admin"),
  ],
  async (req, res) => {
    console.log('REGISTER ROUTE HIT:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      userAgent: req.get('User-Agent'),
      body: req.body ? Object.keys(req.body) : 'no body',
      ip: req.ip
    });
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { name, phone, password, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this phone number already exists",
        });
      }

      // Create new user
      console.log('Creating user with data:', { name, phone, passwordExists: !!password, role: role || "client" });
      const user = await User.create({
        name,
        phone,
        password,
        role: role || "client"
      });
      console.log('User created successfully:', { userId: user._id, passwordSet: !!user.password });

      // Generate token
      const token = generateToken(user._id);

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, 
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Error registering user",
        error: error.message,
      });
    }
  }
);

// Login route
router.post(
  "/login",
  [
    body("identifier").notEmpty().withMessage("Phone number or name is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    console.log('LOGIN ROUTE HIT:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      userAgent: req.get('User-Agent'),
      body: req.body ? Object.keys(req.body) : 'no body',
      ip: req.ip
    });
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { identifier, password } = req.body;

      // Check if identifier is a phone number
      const isPhone = /^0[17]\d{8}$/.test(identifier);
      
      // Find user by phone or name
      let user;
      if (isPhone) {
        user = await User.findOne({ phone: identifier }).select('+password');
      } else {
        user = await User.findOne({ name: identifier }).select('+password');
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check password using bcrypt
      // Password comparison debug (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('Comparing passwords:', { userId: user._id, passwordProvided: !!password, userPasswordExists: !!user.password });
      }
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        console.log('Password comparison failed for user:', user._id);
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Generate token
      const token = generateToken(user._id);

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, 
      });

      res.json({
        success: true,
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Error logging in",
        error: error.message,
      });
    }
  }
);

// Get user profile route
router.get("/me", async (req, res) => {
  try {
    // Extract token from cookies
    const token = req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route. Please login."
      });
    }

    try {
      // Verify token
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          success: false,
          message: 'Server configuration error. Please contact support.'
        });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by ID
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
});

// Logout route
router.post("/logout", (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
});

module.exports = router;