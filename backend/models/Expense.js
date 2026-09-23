// backend/models/Expense.js

const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      // e.g. "November electricity bill", "Teachers' October salaries"
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'salary',        // Teacher / staff pay
        'utilities',     // Electricity, water, gas
        'internet',      // Internet, phone bills
        'rent',          // Building rent
        'maintenance',   // Repairs, cleaning
        'transport',     // Fuel, vehicle maintenance
        'supplies',      // Stationery, office, lab equipment
        'sports',        // Sports events, equipment
        'events',        // Functions, ceremonies
        'marketing',     // Advertisements, brochures
        'legal',         // Legal, audit fees
        'charity',       // Donations, waivers
        'other',
      ],
      default: 'other',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1'],
    },
    date: {
      type: String,             // "YYYY-MM-DD"
      required: [true, 'Expense date is required'],
      trim: true,
    },
    vendor: {
      type: String,
      trim: true,
      default: '',
      // e.g. "IESCO", "ABC Stationery"
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank-transfer', 'cheque', 'card', 'online', 'other'],
      default: 'cash',
    },
    referenceNo: {
      type: String,
      trim: true,
      default: '',
      // Bill number, cheque no, transaction ID
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    // Optional link to a specific class/department (for reporting)
    department: {
      type: String,
      trim: true,
      default: '',
      // e.g. "Computer Science", "Sports"
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// ── Indexes for reports ────────────────────────
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1, date: -1 });
expenseSchema.index({ department: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;