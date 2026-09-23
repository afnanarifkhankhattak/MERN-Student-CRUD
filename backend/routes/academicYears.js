// backend/routes/academicYears.js

const express = require('express');
const router = express.Router();
const AcademicYear = require('../models/AcademicYear');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────
// CREATE — POST /academic-years (admin only)
// ─────────────────────────────────────────────
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    // If this year is being set as active, deactivate all others
    if (req.body.isActive === true) {
      await AcademicYear.updateMany({}, { isActive: false });
    }
    const created = await AcademicYear.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Academic year created successfully',
      data: created,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ALL — GET /academic-years
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const years = await AcademicYear.find().sort({ name: -1 });
    res.status(200).json({
      success: true,
      count: years.length,
      data: years,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ONE — GET /academic-years/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const year = await AcademicYear.findById(req.params.id);
    if (!year) {
      return res.status(404).json({ success: false, message: 'Academic year not found' });
    }
    res.status(200).json({ success: true, data: year });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// UPDATE — PUT /academic-years/:id (admin only)
// ─────────────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    // If we're setting this year as active, deactivate all others first
    if (req.body.isActive === true) {
      await AcademicYear.updateMany(
        { _id: { $ne: req.params.id } },
        { isActive: false }
      );
    }

    const updated = await AcademicYear.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Academic year not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Academic year updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE — DELETE /academic-years/:id (admin only)
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await AcademicYear.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Academic year not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Academic year deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;