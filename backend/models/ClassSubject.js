// backend/models/ClassSubject.js

const mongoose = require('mongoose');

const classSubjectSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
      // Optional — a subject may be unassigned initially
    },
    periodsPerWeek: {
      type: Number,
      default: 3,
      min: [1, 'Must be at least 1 period per week'],
      max: [20, 'Must be at most 20 periods per week'],
      // Used later for timetable generation
    },
    isElective: {
      type: Boolean,
      default: false,
      // If true, only some students take this subject
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// ── Compound index: one class can teach a subject only once ──
classSubjectSchema.index({ class: 1, subject: 1 }, { unique: true });

const ClassSubject = mongoose.model('ClassSubject', classSubjectSchema);

module.exports = ClassSubject;