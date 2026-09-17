// backend/server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const studentRoutes = require('./routes/students');
const authRoutes = require('./routes/auth');       // ← NEW

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Backend is running! 🚀');
});

// Auth routes (login, register)
app.use('/auth', authRoutes);                       // ← NEW

// Student routes (protected)
app.use('/students', studentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});