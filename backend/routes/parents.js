// backend/routes/parents.js

const express = require('express');
const router = express.Router();
const Parent = require('../models/Parent');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────
// CREATE — POST /parents (admin only)
// ─────────────────────────────────────────────
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const created = await Parent.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Parent created successfully',
      data: created,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ALL — GET /parents
// Query filters: ?search=<text>  ?relation=father|mother|...
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.relation) filter.relation = req.query.relation;
    if (req.query.search) {
      const rx = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: rx },
        { phone: rx },
        { cnic: rx },
        { email: rx },
      ];
    }

    const parents = await Parent.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: parents.length,
      data: parents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ONE — GET /parents/:id
// Also returns the parent's children (students with this parent)
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id);
    if (!parent) {
      return res.status(404).json({ success: false, message: 'Parent not found' });
    }
    res.status(200).json({ success: true, data: parent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// UPDATE — PUT /parents/:id (admin only)
// ─────────────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const updated = await Parent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Parent not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Parent updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE — DELETE /parents/:id (admin only)
// ⚠️ Should warn if parent has linked students
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const Student = require('../models/Student');
    const childCount = await Student.countDocuments({ parent: req.params.id });

    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete — this parent has ${childCount} linked student(s). Unlink them first.`,
      });
    }

    const deleted = await Parent.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Parent not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Parent deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;