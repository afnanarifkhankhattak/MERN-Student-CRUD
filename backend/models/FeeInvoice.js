// backend/models/FeeInvoice.js

const mongoose = require('mongoose');

// A single line item on an invoice — snapshot of a fee head at billing time.
const invoiceLineSchema = new mongoose.Schema(
  {
    head: {
      type: String,
      required: [true, 'Line head is required'],
      trim: true,
      // e.g. "Tuition", "Transport"
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    frequency: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const feeInvoiceSchema = new mongoose.Schema(
  {
    // ── Who and where ────────────────────────────
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      default: null,
      // The student's enrollment at the time of billing — captures class+section+roll
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

    // ── What this invoice is for ─────────────────
    period: {
      type: String,
      required: [true, 'Period is required'],
      trim: true,
      // e.g. "2024-12" (December 2024), "Term-1", "Annual-2024"
    },
    periodLabel: {
      type: String,
      trim: true,
      default: '',
      // Human-readable: "December 2024", "Term 1 — 2024-2025"
    },

    // ── The bill itself ──────────────────────────
    invoiceNo: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      // Auto-generated like "INV-2024-0001"
    },
    lineItems: {
      type: [invoiceLineSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      // Scholarships, sibling discounts, etc.
    },
    discountReason: {
      type: String,
      trim: true,
      default: '',
    },
    lateFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      // subtotal - discount + lateFee
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Timing ──────────────────────────────────
    issueDate: {
      type: String,        // "YYYY-MM-DD"
      trim: true,
      default: '',
    },
    dueDate: {
      type: String,        // "YYYY-MM-DD"
      trim: true,
      default: '',
    },

    // ── Status ──────────────────────────────────
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'overdue', 'waived'],
      default: 'unpaid',
      // unpaid  → nothing paid yet
      // partial → some paid, still owing
      // paid    → fully paid
      // overdue → past due date, still owing
      // waived  → forgiven (e.g. scholarship, exceptional case)
    },

    // ── Source references ────────────────────────
    generatedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeStructure',
      default: null,
      // Which structure was used to generate this invoice
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      // Who clicked "Generate"
    },

    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// ── Compound unique: one invoice per student per period per year ──
feeInvoiceSchema.index(
  { student: 1, period: 1, academicYear: 1 },
  { unique: true }
);

// ── Fast lookups for reports ────────────────────
feeInvoiceSchema.index({ class: 1, period: 1 });
feeInvoiceSchema.index({ status: 1 });
feeInvoiceSchema.index({ dueDate: 1 });

// ── Virtual: balance ───────────────────────────
feeInvoiceSchema.virtual('balance').get(function () {
  return Math.max(0, this.totalAmount - this.paidAmount);
});

feeInvoiceSchema.set('toJSON', { virtuals: true });
feeInvoiceSchema.set('toObject', { virtuals: true });

const FeeInvoice = mongoose.model('FeeInvoice', feeInvoiceSchema);

module.exports = FeeInvoice;