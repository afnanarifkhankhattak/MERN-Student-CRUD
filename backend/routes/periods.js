// backend/routes/periods.js

const express = require('express');
const router = express.Router();
const Period = require('../models/Period');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────
// CREATE — POST /periods (admin only)
// ─────────────────────────────────────────────
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const created = await Period.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Period created successfully',
      data: created,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A period with this name already exists.',
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ALL — GET /periods
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    const periods = await Period.find(filter).sort({ order: 1 });
    res.status(200).json({
      success: true,
      count: periods.length,
      data: periods,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ONE — GET /periods/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const period = await Period.findById(req.params.id);
    if (!period) {
      return res.status(404).json({ success: false, message: 'Period not found' });
    }
    res.status(200).json({ success: true, data: period });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// UPDATE — PUT /periods/:id (admin only)
// ─────────────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const updated = await Period.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Period not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Period updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE — DELETE /periods/:id (admin only)
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    // Prevent delete if any timetable entries reference this period
    const TimetableEntry = require('../models/TimetableEntry');
    const usedCount = await TimetableEntry.countDocuments({
      period: req.params.id,
    });
    if (usedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete — ${usedCount} timetable entries use this period. Remove them first.`,
      });
    }

    const deleted = await Period.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Period not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Period deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;