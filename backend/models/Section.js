// backend/models/Section.js

const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Section name is required'],
      trim: true,
      // e.g. "A", "B", "C", "Blue", "Red"
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
      // Optional — a section might not have a class teacher yet
    },
    capacity: {
      type: Number,
      default: 40,
      min: [1, 'Capacity must be at least 1'],
      // Maximum students in this section
    },
    room: {
      type: String,
      trim: true,
      default: '',
      // e.g. "Room 102"
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index: no two sections with the same name in the same class
sectionSchema.index({ class: 1, name: 1 }, { unique: true });

const Section = mongoose.model('Section', sectionSchema);

module.exports = Section;