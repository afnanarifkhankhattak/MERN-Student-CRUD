// backend/models/FeePayment.js

const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema(
  {
    // ── Which invoice this pays ─────────────────
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeInvoice',
      required: [true, 'Invoice reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
      // Denormalized from invoice for quick student-wise lookups
    },

    // ── The payment itself ──────────────────────
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment amount must be at least 1'],
    },
    method: {
      type: String,
      enum: ['cash', 'bank-transfer', 'cheque', 'card', 'online', 'other'],
      required: [true, 'Payment method is required'],
      default: 'cash',
    },
    paymentDate: {
      type: String,             // "YYYY-MM-DD"
      trim: true,
      required: [true, 'Payment date is required'],
    },

    // ── Reference details ───────────────────────
    referenceNo: {
      type: String,
      trim: true,
      default: '',
      // Cheque #, bank txn ID, card reference — depends on method
    },
    bankName: {
      type: String,
      trim: true,
      default: '',
      // For bank transfers and cheques
    },

    // ── Receipt ─────────────────────────────────
    receiptNo: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      // Auto-generated like "R-2025-0001"
    },

    // ── Audit ───────────────────────────────────
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      // Who recorded this payment
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
      // e.g. "Advance payment for next term"
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'reversed'],
      default: 'completed',
      // completed → money received, counted in invoice
      // pending   → e.g. cheque not yet cleared
      // reversed  → cheque bounced or correction — excluded from invoice total
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────
feePaymentSchema.index({ invoice: 1 });
feePaymentSchema.index({ student: 1, paymentDate: -1 });
feePaymentSchema.index({ paymentDate: -1 });
feePaymentSchema.index({ method: 1 });

const FeePayment = mongoose.model('FeePayment', feePaymentSchema);

module.exports = FeePayment;