// backend/models/ExamSubject.js

const mongoose = require('mongoose');

const examSubjectSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam reference is required'],
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
      // Who teaches this subject in this exam (optional)
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks are required'],
      min: [1, 'Total marks must be at least 1'],
      max: [1000, 'Total marks must be at most 1000'],
    },
    passingMarks: {
      type: Number,
      required: [true, 'Passing marks are required'],
      min: [0, 'Passing marks cannot be negative'],
    },
    examDate: {
      type: String,             // "YYYY-MM-DD"
      trim: true,
      default: '',
    },
    room: {
      type: String,
      trim: true,
      default: '',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// ── Compound unique: one subject per exam ───────
examSubjectSchema.index(
  { exam: 1, subject: 1 },
  { unique: true }
);

// ── Fast lookup by exam ─────────────────────────
examSubjectSchema.index({ exam: 1 });

// ── Validation: passing marks can't exceed total ─
examSubjectSchema.pre('save', function (next) {
  if (this.passingMarks > this.totalMarks) {
    return next(
      new Error('Passing marks cannot be greater than total marks')
    );
  }
  next();
});

const ExamSubject = mongoose.model('ExamSubject', examSubjectSchema);

module.exports = ExamSubject;