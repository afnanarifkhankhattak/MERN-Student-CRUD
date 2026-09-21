// backend/models/Fee.js

const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    // Reference to the Student document
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    // Snapshots for quick display (in case the student is later deleted)
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    regNo: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true,
    },
    // Fee amounts
    amount: {
      type: Number,
      required: [true, 'Total fee amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paidAmount: {
      type: Number,
      required: [true, 'Paid amount is required'],
      min: [0, 'Paid amount cannot be negative'],
      default: 0,
    },
    // Payment info
    dueDate: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// ── Virtual: remaining balance ─────────────────
feeSchema.virtual('balance').get(function () {
  return Math.max(0, this.amount - this.paidAmount);
});

// ── Virtual: status ────────────────────────────
feeSchema.virtual('status').get(function () {
  if (this.paidAmount >= this.amount) return 'Paid';
  if (this.paidAmount > 0) return 'Partial';
  return 'Pending';
});

// Ensure virtuals appear in JSON
feeSchema.set('toJSON', { virtuals: true });
feeSchema.set('toObject', { virtuals: true });

const Fee = mongoose.model('Fee', feeSchema);

module.exports = Fee;