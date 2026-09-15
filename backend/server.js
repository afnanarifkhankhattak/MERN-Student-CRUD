// backend/server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const studentRoutes = require('./routes/students');

connectDB();

const app = express();

// ── Middleware ──────────────────────────────────
app.use(cors());           // Allow requests from any origin
app.use(express.json());   // Parse JSON request bodies

// ── Test route ──────────────────────────────────
app.get('/', (req, res) => {
  res.send('Backend is running! 🚀');
});

// ── Student routes ──────────────────────────────
// 👇 THIS LINE WAS MISSING — it registers all routes from students.js
app.use('/students', studentRoutes);

// ── Start server ────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});