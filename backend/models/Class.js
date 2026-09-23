// backend/models/Class.js

const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
      unique: true,
      // e.g. "Nursery", "KG", "Grade 1", "Grade 10"
    },
    numericLevel: {
      type: Number,
      required: [true, 'Numeric level is required'],
      // 0 = Nursery, -1 = KG, 1-12 = Grades
      // Used for sorting.
    },
    order: {
      type: Number,
      default: 0,
      // Optional manual sort override
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Default sort: by numericLevel ascending
classSchema.index({ numericLevel: 1 });

const Class = mongoose.model('Class', classSchema);

module.exports = Class;