// backend/models/ExamResult.js

const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema(
  {
    examSubject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamSubject',
      required: [true, 'ExamSubject reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      default: null,
      // The student's enrollment at the time of the exam — captures rollNo,
      // class, section, academicYear. Useful for historical accuracy if the
      // student later changes class.
    },
    obtainedMarks: {
      type: Number,
      required: [true, 'Obtained marks are required'],
      min: [0, 'Obtained marks cannot be negative'],
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
      // e.g. "Absent", "Medical leave", "Excellent improvement"
    },
    isAbsent: {
      type: Boolean,
      default: false,
      // If true, the student didn't appear for the exam — marks may be 0
    },
  },
  { timestamps: true }
);

// ── Compound unique: one result per student per exam subject ──
examResultSchema.index(
  { examSubject: 1, student: 1 },
  { unique: true }
);

// ── Fast lookups ────────────────────────────────
examResultSchema.index({ examSubject: 1 });
examResultSchema.index({ student: 1 });

// ── Virtual: grade (letter grade from percentage) ──
// Formula: percentage = obtained / total * 100
// NOTE: We need the parent ExamSubject's totalMarks, which isn't
// available here unless we populate. So this virtual only works when
// the document is populated with `examSubject`. We return '-' otherwise.
examResultSchema.virtual('grade').get(function () {
  if (!this.examSubject || typeof this.examSubject !== 'object') return '-';
  const total = this.examSubject.totalMarks;
  if (!total || total === 0) return '-';
  const percentage = (this.obtainedMarks / total) * 100;
  return computeGrade(percentage);
});

examResultSchema.virtual('percentage').get(function () {
  if (!this.examSubject || typeof this.examSubject !== 'object') return 0;
  const total = this.examSubject.totalMarks;
  if (!total || total === 0) return 0;
  return Math.round((this.obtainedMarks / total) * 100);
});

examResultSchema.virtual('isPassed').get(function () {
  if (this.isAbsent) return false;
  if (!this.examSubject || typeof this.examSubject !== 'object') return false;
  const passing = this.examSubject.passingMarks;
  return this.obtainedMarks >= passing;
});

examResultSchema.set('toJSON', { virtuals: true });
examResultSchema.set('toObject', { virtuals: true });

// ── Grade calculation helper ────────────────────
function computeGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  if (percentage >= 40) return 'E';
  return 'F';
}

const ExamResult = mongoose.model('ExamResult', examResultSchema);

module.exports = ExamResult;