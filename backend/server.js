// backend/server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

// ── Existing routes ─────────────────────────────
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const courseRoutes = require('./routes/courses');

// ── Legacy fee route ────────────────────────────
const feeRoutes = require('./routes/fees');

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

// ── Exam routes ─────────────────────────────────
const examRoutes = require('./routes/exams');

// ── Fee management routes ───────────────────────
const feeStructureRoutes = require('./routes/feeStructures');
const feeInvoiceRoutes = require('./routes/feeInvoices');
const feePaymentRoutes = require('./routes/feePayments');

// ── Accounting routes ───────────────────────────
const expenseRoutes = require('./routes/expenses');
const accountingRoutes = require('./routes/accounting');

// ── NEW: Timetable routes (Phase 10) ────────────
const periodRoutes = require('./routes/periods');
const timetableRoutes = require('./routes/timetable');

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
app.use('/courses', courseRoutes);

// ── Legacy fee mount ────────────────────────────
app.use('/fees', feeRoutes);

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

// ── Exam mount ──────────────────────────────────
app.use('/exams', examRoutes);

// ── Fee management mounts ───────────────────────
app.use('/fee-structures', feeStructureRoutes);
app.use('/fee-invoices', feeInvoiceRoutes);
app.use('/fee-payments', feePaymentRoutes);

// ── Accounting mounts ───────────────────────────
app.use('/expenses', expenseRoutes);
app.use('/accounting', accountingRoutes);

// ── NEW: Timetable mounts ───────────────────────
app.use('/periods', periodRoutes);
app.use('/timetable', timetableRoutes);

// ── Start server ────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});