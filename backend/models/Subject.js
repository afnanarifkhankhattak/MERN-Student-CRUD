// backend/models/Subject.js

const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      unique: true,
      // e.g. "Mathematics", "English", "Physics"
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      // e.g. "MATH", "ENG", "PHY"
      // sparse: true means: unique among non-empty values only.
      // So multiple subjects with empty code are allowed.
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isCore: {
      type: Boolean,
      default: true,
      // Core = compulsory (Math, English)
      // Non-core = elective (Advanced Art, Music)
    },
    colorHex: {
      type: String,
      trim: true,
      default: '#4a72c4',
      // Optional display color for UI tags
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;