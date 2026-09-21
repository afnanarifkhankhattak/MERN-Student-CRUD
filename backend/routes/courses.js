// backend/routes/courses.js

const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, requireRole } = require('../middleware/authMiddleware');

// CREATE — admin only
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const created = await Course.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: created,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// READ ALL
router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// READ ONE
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE — admin only
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE — admin only
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Course.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;