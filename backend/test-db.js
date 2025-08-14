const mongoose = require('mongoose');
const config = require('config');

async function testDB() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', config.get('mongoURI'));
    
    await mongoose.connect(config.get('mongoURI'));
    console.log('✅ MongoDB connected successfully!');
    
    // Test User model
    const User = require('./models/User');
    console.log('✅ User model loaded successfully!');
    
    // Test creating a user
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      userType: 'operator',
      assignedDistricts: []
    });
    
    await testUser.save();
    console.log('✅ Test user created successfully with ID:', testUser._id);
    
    // Clean up - delete test user
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ Test user cleaned up');
    
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDB();
