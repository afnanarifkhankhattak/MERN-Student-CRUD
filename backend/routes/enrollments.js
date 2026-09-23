// backend/routes/enrollments.js

const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────
// Helper: populate all references
// ─────────────────────────────────────────────
const populateEnrollment = (query) => {
  return query
    .populate('student', 'name username regNo admissionNo picture')
    .populate('class', 'name numericLevel')
    .populate('section', 'name')
    .populate('academicYear', 'name startDate endDate isActive');
};

// ─────────────────────────────────────────────
// ⚠️ SPECIAL ROUTES — must come before /:id
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// GET /enrollments/next-roll
// Suggest the next available roll number for a class + section + year
// Query: ?class=<id>&section=<id>&academicYear=<id>
// ─────────────────────────────────────────────
router.get('/next-roll', protect, async (req, res) => {
  try {
    const { class: classId, section, academicYear } = req.query;

    if (!classId || !section || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'class, section, and academicYear query params are required',
      });
    }

    // Find the highest existing roll number in this combination
    const topEnrollment = await Enrollment.findOne({
      class: classId,
      section,
      academicYear,
    }).sort({ rollNo: -1 });

    const nextRoll = topEnrollment ? topEnrollment.rollNo + 1 : 1;

    res.status(200).json({
      success: true,
      data: { nextRoll },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /enrollments/roster
// Get all active students in a class+section+year, sorted by rollNo
// Query: ?class=<id>&section=<id>&academicYear=<id>
// ─────────────────────────────────────────────
router.get('/roster', protect, async (req, res) => {
  try {
    const { class: classId, section, academicYear } = req.query;

    if (!classId || !section || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'class, section, and academicYear query params are required',
      });
    }

    const roster = await populateEnrollment(
      Enrollment.find({
        class: classId,
        section,
        academicYear,
        status: 'active',
      }).sort({ rollNo: 1 })
    );

    res.status(200).json({
      success: true,
      count: roster.length,
      data: roster,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// CREATE — POST /enrollments (admin only)
// ─────────────────────────────────────────────
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const created = await Enrollment.create(req.body);
    const populated = await populateEnrollment(Enrollment.findById(created._id));

    res.status(201).json({
      success: true,
      message: 'Enrollment created successfully',
      data: populated,
    });
  } catch (error) {
    // Handle duplicate roll number with a friendly message
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'That roll number is already taken in this class, section, and year.',
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ALL — GET /enrollments
// Filters:
//   ?student=<id>
//   ?class=<id>
//   ?section=<id>
//   ?academicYear=<id>
//   ?status=active|transferred|completed|dropped
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    if (req.query.class) filter.class = req.query.class;
    if (req.query.section) filter.section = req.query.section;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.status) filter.status = req.query.status;

    const enrollments = await populateEnrollment(
      Enrollment.find(filter).sort({ createdAt: -1 })
    );

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ONE — GET /enrollments/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const enrollment = await populateEnrollment(Enrollment.findById(req.params.id));
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }
    res.status(200).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// UPDATE — PUT /enrollments/:id (admin only)
// ─────────────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const updated = await Enrollment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }
    const populated = await populateEnrollment(Enrollment.findById(updated._id));
    res.status(200).json({
      success: true,
      message: 'Enrollment updated successfully',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'That roll number is already taken in this class, section, and year.',
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE — DELETE /enrollments/:id (admin only)
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Enrollment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Enrollment deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;