const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cleancloak', {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create test user
const createTestUser = async () => {
  try {
    const phone = process.argv[2] || '0712345678';
    const password = process.argv[3] || 'test123';
    const name = process.argv[4] || 'Test User';
    const role = process.argv[5] || 'client';

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      console.log(`User with phone ${phone} already exists`);
      mongoose.connection.close();
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create the user
    const user = new User({
      name,
      phone,
      password: hashedPassword,
      role,
      isVerified: true,
      verificationStatus: 'verified'
    });
    
    await user.save();
    console.log('Test user created successfully!');
    console.log(`Phone: ${phone}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating test user:', error);
    mongoose.connection.close();
  }
};

connectDB().then(createTestUser);