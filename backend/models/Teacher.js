// backend/models/Teacher.js

const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    // ── Existing fields (kept for backward compatibility) ──
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Teacher name is required'],
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
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative'],
      max: [60, 'Experience must be 60 years or less'],
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary cannot be negative'],
    },
    joiningDate: {
      type: String,
      trim: true,
      default: '',
    },

    // ── NEW: School-style fields (all optional) ────────────
    cnic: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      default: '',
      // e.g. "61101-1234567-1"
    },
    dob: {
      type: String,
      trim: true,
      default: '',
      // "YYYY-MM-DD"
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: '',
    },
    qualification: {
      type: String,
      trim: true,
      default: '',
      // e.g. "M.Phil Physics", "MSc Mathematics"
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive', 'resigned'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// ── Indexes for the new relationship queries ────
teacherSchema.index({ subjects: 1 });
teacherSchema.index({ classes: 1 });
teacherSchema.index({ status: 1 });

// ── Virtual: teaching load ──────────────────────
// Number of subjects × classes combinations
teacherSchema.virtual('teachingLoad').get(function () {
  return (this.subjects?.length || 0) + (this.classes?.length || 0);
});

teacherSchema.set('toJSON', { virtuals: true });
teacherSchema.set('toObject', { virtuals: true });

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;