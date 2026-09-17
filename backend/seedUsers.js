// backend/seedUsers.js
// Run this ONCE to create the initial admin and student accounts.
// Usage:  node seedUsers.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Delete existing users (so re-running this script resets them)
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Hash passwords
    const adminPass = await bcrypt.hash('admin123', 10);
    const studentPass = await bcrypt.hash('student123', 10);

    // Insert users
    await User.create([
      { username: 'admin', password: adminPass, role: 'admin' },
      { username: 'student', password: studentPass, role: 'student' },
    ]);

    console.log('✅ Created users:');
    console.log('   admin   / admin123   (role: admin)');
    console.log('   student / student123 (role: student)');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();