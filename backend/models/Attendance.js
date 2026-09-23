// backend/models/Attendance.js

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Section reference is required'],
    },
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Academic year reference is required'],
    },
    date: {
      type: String,              // "YYYY-MM-DD"
      required: [true, 'Date is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'leave'],
      required: [true, 'Status is required'],
      default: 'present',
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      // Who took the attendance (a teacher or admin)
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// ── Compound unique index: one attendance record per student per date ──
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

// ── Fast lookups for reports ───────────────────
attendanceSchema.index({ class: 1, section: 1, date: 1 });
attendanceSchema.index({ student: 1, status: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;