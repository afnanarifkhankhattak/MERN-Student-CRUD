// backend/models/Period.js

const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Period name is required'],
      trim: true,
      // e.g. "Period 1", "Break", "Lunch", "Assembly"
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
      min: [0, 'Order cannot be negative'],
      // 1, 2, 3, ... for ordering. Breaks get an order too.
    },
    startTime: {
      type: String,
      trim: true,
      default: '',
      // "08:00" (24-hour format)
    },
    endTime: {
      type: String,
      trim: true,
      default: '',
      // "08:45"
    },
    isBreak: {
      type: Boolean,
      default: false,
      // true for assembly, break, lunch
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

// ── Index for ordering ─────────────────────────
periodSchema.index({ order: 1 });
periodSchema.index({ name: 1 }, { unique: true });

const Period = mongoose.model('Period', periodSchema);

module.exports = Period;