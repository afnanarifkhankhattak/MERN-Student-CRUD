// backend/server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

// ── Existing routes ─────────────────────────────
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const feeRoutes = require('./routes/fees');
const courseRoutes = require('./routes/courses');

// ── Academic Foundation routes ──────────────────
const academicYearRoutes = require('./routes/academicYears');
const classRoutes = require('./routes/classes');
const sectionRoutes = require('./routes/sections');
const subjectRoutes = require('./routes/subjects');
const classSubjectRoutes = require('./routes/classSubjects');

// ── Parent routes ───────────────────────────────
const parentRoutes = require('./routes/parents');

// ── Enrollment routes ───────────────────────────
const enrollmentRoutes = require('./routes/enrollments');

// ── Attendance routes ───────────────────────────
const attendanceRoutes = require('./routes/attendance');

// ── NEW: Exam routes ────────────────────────────
const examRoutes = require('./routes/exams');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// ── Test route ──────────────────────────────────
app.get('/', (req, res) => {
  res.send('Backend is running! 🚀');
});

// ── Existing mounts ─────────────────────────────
app.use('/auth', authRoutes);
app.use('/students', studentRoutes);
app.use('/teachers', teacherRoutes);
app.use('/fees', feeRoutes);
app.use('/courses', courseRoutes);

// ── Academic Foundation mounts ──────────────────
app.use('/academic-years', academicYearRoutes);
app.use('/classes', classRoutes);
app.use('/sections', sectionRoutes);
app.use('/subjects', subjectRoutes);
app.use('/class-subjects', classSubjectRoutes);

// ── Parent mount ────────────────────────────────
app.use('/parents', parentRoutes);

// ── Enrollment mount ────────────────────────────
app.use('/enrollments', enrollmentRoutes);

// ── Attendance mount ────────────────────────────
app.use('/attendance', attendanceRoutes);

// ── NEW: Exam mount ─────────────────────────────
app.use('/exams', examRoutes);

// ── Start server ────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});