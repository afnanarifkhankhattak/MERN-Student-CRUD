// backend/models/FeeStructure.js

const mongoose = require('mongoose');

// A single fee line item inside a fee structure.
// e.g. { head: 'Tuition', amount: 5000, frequency: 'monthly' }
const feeHeadSchema = new mongoose.Schema(
  {
    head: {
      type: String,
      required: [true, 'Fee head name is required'],
      trim: true,
      // e.g. "Tuition", "Transport", "Library", "Exam Fee"
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'term', 'annual', 'one-time'],
      default: 'monthly',
    },
    isOptional: {
      type: Boolean,
      default: false,
      // Optional heads (like Transport) are only charged if a student opts in
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true } // each head gets its own _id for easy reference
);

const feeStructureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Fee structure name is required'],
      trim: true,
      // e.g. "Grade 5 — 2024-2025 Standard"
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
    heads: {
      type: [feeHeadSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'At least one fee head is required',
      },
    },
    // Amounts below are computed and cached for fast display.
    // They must be recalculated when heads change (we do this in the routes).
    totalMonthly: {
      type: Number,
      default: 0,
    },
    totalOneTime: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// One structure per class + year
feeStructureSchema.index(
  { class: 1, academicYear: 1, name: 1 },
  { unique: true }
);

// Auto-compute totals before save
feeStructureSchema.pre('save', function (next) {
  let monthly = 0;
  let oneTime = 0;
  this.heads.forEach((h) => {
    if (h.frequency === 'monthly') monthly += h.amount;
    else if (h.frequency === 'one-time') oneTime += h.amount;
  });
  this.totalMonthly = monthly;
  this.totalOneTime = oneTime;
  next();
});

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);

module.exports = FeeStructure;