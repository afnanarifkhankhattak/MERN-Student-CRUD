// backend/routes/students.js

const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────
// Helper: apply populate to a query
// Keeps our populate fields in ONE place
// ─────────────────────────────────────────────
const populateStudent = (query) => {
  return query
    .populate('class', 'name numericLevel')
    .populate('section', 'name class')
    .populate('academicYear', 'name startDate endDate isActive')
    .populate('parent', 'name phone email');
};

// ─────────────────────────────────────────────
// CREATE — Add a new student (any logged-in user)
// POST /students
// ─────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const newStudent = await Student.create(req.body);
    // Fetch it back with populated references
    const populated = await populateStudent(Student.findById(newStudent._id));

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: populated,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// BULK CREATE — Add many students at once (admin only)
// POST /students/bulk
// ⚠️ MUST come before /:id routes
// ─────────────────────────────────────────────
router.post('/bulk', protect, requireRole('admin'), async (req, res) => {
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
// READ ALL — Get every student (with filters)
// GET /students
//   ?class=<classId>
//   ?section=<sectionId>
//   ?status=active|inactive|alumni
//   ?academicYear=<yearId>
//   ?search=<text>
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};

    if (req.query.class)        filter.class = req.query.class;
    if (req.query.section)      filter.section = req.query.section;
    if (req.query.status)       filter.status = req.query.status;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;

    // Text search across name, username, admissionNo, regNo
    if (req.query.search) {
      const rx = new RegExp(req.query.search, 'i'); // case-insensitive
      filter.$or = [
        { name: rx },
        { username: rx },
        { admissionNo: rx },
        { regNo: rx },
      ];
    }

    const students = await populateStudent(
      Student.find(filter).sort({ createdAt: -1 })
    );

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
// READ ONE — Get a single student by id
// GET /students/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await populateStudent(Student.findById(req.params.id));
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
// UPDATE — Modify an existing student (admin only)
// PUT /students/:id
// ─────────────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
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

    // Re-fetch with populated references
    const populated = await populateStudent(Student.findById(updatedStudent._id));

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: populated,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// DELETE — Remove a student (admin only)
// DELETE /students/:id
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
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