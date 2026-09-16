// backend/routes/students.js

const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// ─────────────────────────────────────────────
// CREATE — Add a new student
// POST /students
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const newStudent = await Student.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: newStudent,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// BULK CREATE — Add many students at once (used by CSV upload)
// POST /students/bulk
// ⚠️ IMPORTANT: this MUST come BEFORE any /:id routes
// ─────────────────────────────────────────────
router.post('/bulk', async (req, res) => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No students provided. Send an array in the "students" field.',
      });
    }

    const inserted = [];
    const failed = [];

    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      try {
        const created = await Student.create(row);
        inserted.push(created);
      } catch (err) {
        failed.push({
          row: i + 1,
          regNo: row.regNo || '(missing)',
          reason: err.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      insertedCount: inserted.length,
      failedCount: failed.length,
      inserted,
      failed,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// READ ALL — Get every student
// GET /students
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// READ ONE — Get a single student by id
// GET /students/:id
// ⚠️ This is a wildcard. It must come AFTER specific routes.
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }
    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// UPDATE — Modify an existing student
// PUT /students/:id
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// DELETE — Remove a student
// DELETE /students/:id
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);

    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
      data: deletedStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;