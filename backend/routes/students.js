// backend/routes/students.js

const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { protect, requireRole } = require('../middleware/authMiddleware');  // ← NEW

// ─────────────────────────────────────────────
// CREATE — Add a new student (any logged-in user)
// POST /students
// ─────────────────────────────────────────────
router.post('/', protect, async (req, res) => {                            // ← NEW
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
// BULK CREATE (admin only)
// POST /students/bulk
// ─────────────────────────────────────────────
router.post('/bulk', protect, requireRole('admin'), async (req, res) => {  // ← NEW
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
// READ ALL (any logged-in user)
// GET /students
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {                             // ← NEW
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
// READ ONE (any logged-in user)
// GET /students/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {                          // ← NEW
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
// UPDATE (admin only)
// PUT /students/:id
// ─────────────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {    // ← NEW
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
// DELETE (admin only)
// DELETE /students/:id
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => { // ← NEW
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