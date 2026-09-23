// backend/routes/classSubjects.js

const express = require('express');
const router = express.Router();
const ClassSubject = require('../models/ClassSubject');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────
// CREATE — POST /class-subjects (admin only)
// ─────────────────────────────────────────────
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const created = await ClassSubject.create(req.body);
    // Fetch it back with populated references
    const populated = await ClassSubject.findById(created._id)
      .populate('class', 'name numericLevel')
      .populate('subject', 'name code colorHex')
      .populate('teacher', 'name employeeId');

    res.status(201).json({
      success: true,
      message: 'Class subject added successfully',
      data: populated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ALL — GET /class-subjects
// Optional filters: ?class=<classId>  ?subject=<subjectId>  ?teacher=<teacherId>
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.class)   filter.class   = req.query.class;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.teacher) filter.teacher = req.query.teacher;

    const items = await ClassSubject.find(filter)
      .populate('class', 'name numericLevel')
      .populate('subject', 'name code colorHex')
      .populate('teacher', 'name employeeId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ONE — GET /class-subjects/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await ClassSubject.findById(req.params.id)
      .populate('class', 'name numericLevel')
      .populate('subject', 'name code colorHex')
      .populate('teacher', 'name employeeId');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Class subject not found' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// UPDATE — PUT /class-subjects/:id (admin only)
// ─────────────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const updated = await ClassSubject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('class', 'name numericLevel')
      .populate('subject', 'name code colorHex')
      .populate('teacher', 'name employeeId');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Class subject not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Class subject updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE — DELETE /class-subjects/:id (admin only)
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await ClassSubject.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Class subject not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Class subject deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;