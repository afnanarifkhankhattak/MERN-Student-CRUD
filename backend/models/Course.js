// backend/models/Course.js

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      unique: true,
      uppercase: true,
    },
    credits: {
      type: Number,
      required: [true, 'Credits are required'],
      min: [1, 'Credits must be at least 1'],
      max: [6, 'Credits must be at most 6'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be at least 1'],
      max: [8, 'Semester must be at most 8'],
    },
    // Reference to the teacher who teaches it
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    // Snapshot for fast display
    teacherName: {
      type: String,
      trim: true,
      default: '',
    },
    // Enrolled students (list of Student ObjectIds)
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Virtual: how many students are enrolled
courseSchema.virtual('studentCount').get(function () {
  return Array.isArray(this.students) ? this.students.length : 0;
});

courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;