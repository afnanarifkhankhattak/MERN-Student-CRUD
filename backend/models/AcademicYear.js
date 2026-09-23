// backend/models/AcademicYear.js

const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Academic year name is required'],
      trim: true,
      unique: true,
      // e.g. "2024-2025"
    },
    startDate: {
      type: String,        // stored as ISO string, e.g. "2024-04-01"
      trim: true,
    },
    endDate: {
      type: String,        // e.g. "2025-03-31"
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      // Only ONE academic year should be active at a time.
      // We enforce this in the route logic (not the schema).
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

const AcademicYear = mongoose.model('AcademicYear', academicYearSchema);

module.exports = AcademicYear;