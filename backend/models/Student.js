// backend/models/Student.js

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    // ── Existing fields (kept for backward compatibility) ──
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      unique: true,
    },
    regNo: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    picture: {
      type: String,
      default:
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=',
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [15, 'Age must be at least 15'],
      max: [80, 'Age must be at most 80'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    semester: {
      type: Number,
      min: [1, 'Semester must be at least 1'],
      max: [12, 'Semester must be at most 12'],
      default: null,
    },

    // ── NEW: School-style fields (all optional) ──────────
    admissionNo: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      // Unique only when provided. Allows legacy students without one.
    },
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    dob: {
      type: String,
      trim: true,
      default: '',
      // stored as "YYYY-MM-DD" string
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
      default: '',
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
    },
    rollNo: {
      type: String,
      trim: true,
      default: '',
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
      default: null,
      // Parent model comes in Phase 4. Field exists now so we don't
      // have to migrate again later.
    },
    admissionDate: {
      type: String,
      trim: true,
      default: '',
    },
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'alumni'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// ── Index for quick class/section lookups ───────
studentSchema.index({ class: 1, section: 1 });
studentSchema.index({ status: 1 });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;