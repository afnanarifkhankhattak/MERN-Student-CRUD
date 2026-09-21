// backend/models/Teacher.js

const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
    },
    picture: {
      type: String,
      default: 'https://via.placeholder.com/100',
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative'],
      max: [60, 'Experience must be 60 years or less'],
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary cannot be negative'],
    },
    joiningDate: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;