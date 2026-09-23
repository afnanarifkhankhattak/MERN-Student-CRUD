// backend/models/Exam.js

const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exam name is required'],
      trim: true,
      // e.g. "Mid Term 2024", "Final Term", "Quiz 1"
    },
    examType: {
      type: String,
      enum: ['mid-term', 'final', 'monthly', 'quiz', 'other'],
      default: 'other',
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Academic year reference is required'],
    },
    startDate: {
      type: String,             // "YYYY-MM-DD"
      trim: true,
      default: '',
    },
    endDate: {
      type: String,             // "YYYY-MM-DD"
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'ongoing', 'completed', 'published'],
      default: 'draft',
      // draft       → being planned, not visible to students
      // ongoing     → exam is happening right now
      // completed   → marks being entered
      // published   → results released to students/parents
    },
  },
  { timestamps: true }
);

// ── Compound unique: no two exams with same name for the same class+year ──
examSchema.index(
  { name: 1, class: 1, academicYear: 1 },
  { unique: true }
);

// ── Fast lookups ────────────────────────────────
examSchema.index({ class: 1, academicYear: 1 });
examSchema.index({ status: 1 });

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;