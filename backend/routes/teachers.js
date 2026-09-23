// backend/routes/teachers.js

const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────
// Helper: apply populate to a query
// ─────────────────────────────────────────────
const populateTeacher = (query) => {
  return query
    .populate('subjects', 'name code colorHex')
    .populate('classes', 'name numericLevel');
};

// ─────────────────────────────────────────────
// CREATE — Add a teacher (admin only)
// POST /teachers
// ─────────────────────────────────────────────
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const newTeacher = await Teacher.create(req.body);
    const populated = await populateTeacher(Teacher.findById(newTeacher._id));

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: populated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ALL — GET /teachers
//   ?subject=<subjectId>
//   ?class=<classId>
//   ?status=active|inactive|resigned
//   ?search=<text>
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};

    if (req.query.subject) filter.subjects = req.query.subject;
    if (req.query.class)   filter.classes  = req.query.class;
    if (req.query.status)  filter.status   = req.query.status;

    if (req.query.search) {
      const rx = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: rx },
        { username: rx },
        { employeeId: rx },
        { email: rx },
        { phone: rx },
      ];
    }

    const teachers = await populateTeacher(
      Teacher.find(filter).sort({ createdAt: -1 })
    );

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ONE — GET /teachers/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const teacher = await populateTeacher(Teacher.findById(req.params.id));
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// UPDATE — PUT /teachers/:id (admin only)
// ─────────────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const updated = await Teacher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const populated = await populateTeacher(Teacher.findById(updated._id));

    res.status(200).json({
      success: true,
      message: 'Teacher updated successfully',
      data: populated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE — DELETE /teachers/:id (admin only)
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Teacher.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;