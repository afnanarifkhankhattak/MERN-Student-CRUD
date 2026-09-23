// backend/routes/sections.js

const express = require('express');
const router = express.Router();
const Section = require('../models/Section');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────
// CREATE — POST /sections (admin only)
// ─────────────────────────────────────────────
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const created = await Section.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Section created successfully',
      data: created,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ALL — GET /sections
// Optional filter: ?class=<classId>
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.class) filter.class = req.query.class;

    const sections = await Section.find(filter)
      .populate('class', 'name numericLevel')
      .populate('classTeacher', 'name employeeId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sections.length,
      data: sections,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ONE — GET /sections/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('class', 'name numericLevel')
      .populate('classTeacher', 'name employeeId');
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }
    res.status(200).json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// UPDATE — PUT /sections/:id (admin only)
// ─────────────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const updated = await Section.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Section updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE — DELETE /sections/:id (admin only)
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Section.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Section deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;