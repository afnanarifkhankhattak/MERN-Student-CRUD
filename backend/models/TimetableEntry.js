// backend/models/TimetableEntry.js

const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema(
  {
    // ── Where in the grid ────────────────────────
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
    day: {
      type: String,
      required: [true, 'Day is required'],
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      lowercase: true,
    },
    period: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Period',
      required: [true, 'Period reference is required'],
    },

    // ── What's taught ────────────────────────────
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
      // Can be null for slots like "Assembly", "Free Period"
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    room: {
      type: String,
      trim: true,
      default: '',
      // e.g. "Room 102", "Lab 3"
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      // e.g. "Bring lab coats", "Double period"
    },
  },
  { timestamps: true }
);

// ── Compound unique: one entry per class+section+year+day+period ──
// This is the "class conflict" prevention.
timetableEntrySchema.index(
  { class: 1, section: 1, academicYear: 1, day: 1, period: 1 },
  { unique: true }
);

// ── Fast lookups ────────────────────────────────
timetableEntrySchema.index({ teacher: 1, day: 1, period: 1 });
timetableEntrySchema.index({ room: 1, day: 1, period: 1 });
timetableEntrySchema.index({ academicYear: 1 });

const TimetableEntry = mongoose.model('TimetableEntry', timetableEntrySchema);

module.exports = TimetableEntry;
