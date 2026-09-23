// backend/models/Parent.js

const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Parent name is required'],
      trim: true,
    },
    relation: {
      type: String,
      enum: ['father', 'mother', 'guardian', 'other'],
      default: 'father',
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    cnic: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      default: '',
      // e.g. "61101-1234567-1"
    },
    occupation: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    altPhone: {
      type: String,
      trim: true,
      default: '',
      // Optional alternate contact
    },
    notes: {
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

// Empty string for cnic shouldn't count as duplicate → sparse handles that,
// but we need to be sure empty strings are stored as undefined instead.
parentSchema.pre('save', function (next) {
  if (this.cnic === '') this.cnic = undefined;
  if (this.email === '') this.email = undefined;
  next();
});

const Parent = mongoose.model('Parent', parentSchema);

module.exports = Parent;