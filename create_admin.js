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

// Create admin user
const createAdmin = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ phone: '0700000000', role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user with phone 0700000000 already exists');
      mongoose.connection.close();
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('cloak123', salt);
    
    // Create the admin user
    const adminUser = new User({
      name: 'Admin User',
      phone: '0700000000',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      verificationStatus: 'verified'
    });
    
    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Phone: 0700000000');
    console.log('Password: cloak123');
    console.log('Role: admin');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin user:', error);
    mongoose.connection.close();
  }
};

connectDB().then(createAdmin);