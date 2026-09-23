// backend/models/Enrollment.js

const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
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
    rollNo: {
      type: Number,
      required: [true, 'Roll number is required'],
      min: [1, 'Roll number must be at least 1'],
    },
    enrolledDate: {
      type: String,           // "YYYY-MM-DD"
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'transferred', 'completed', 'dropped'],
      default: 'active',
      // active      → currently enrolled
      // transferred → moved to another section/class mid-year
      // completed   → finished the year successfully
      // dropped     → left the school before completing
    },
    leavingDate: {
      type: String,
      trim: true,
      default: '',
      // When the student left this enrollment (transfer, completion, drop)
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// ── Compound unique index: no two students share a roll no in the same class+section+year ──
enrollmentSchema.index(
  { class: 1, section: 1, academicYear: 1, rollNo: 1 },
  { unique: true }
);

// ── Index for finding a student's enrollments ──
enrollmentSchema.index({ student: 1, academicYear: 1 });
enrollmentSchema.index({ student: 1, status: 1 });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment;