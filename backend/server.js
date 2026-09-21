// backend/server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const studentRoutes = require('./routes/students');
const authRoutes = require('./routes/auth');
const teacherRoutes = require('./routes/teachers');    // ← NEW

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running! 🚀');
});

app.use('/auth', authRoutes);
app.use('/students', studentRoutes);
app.use('/teachers', teacherRoutes);                   // ← NEW

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});