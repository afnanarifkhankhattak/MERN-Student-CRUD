// backend/routes/teachers.js

const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────
// CREATE — Add a teacher (admin only)
// POST /teachers
// ─────────────────────────────────────────────
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const newTeacher = await Teacher.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: newTeacher,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// READ ALL — Get every teacher
// GET /teachers  (any logged-in user)
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// READ ONE
// GET /teachers/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }
    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// UPDATE — Modify a teacher (admin only)
// PUT /teachers/:id
// ─────────────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const updated = await Teacher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Teacher updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// DELETE — Remove a teacher (admin only)
// DELETE /teachers/:id
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Teacher.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;