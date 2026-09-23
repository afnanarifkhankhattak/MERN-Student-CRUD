// backend/routes/attendance.js

const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────
// Helper: populate all references
// ─────────────────────────────────────────────
const populateAttendance = (query) => {
  return query
    .populate('student', 'name username regNo admissionNo picture phone')
    .populate('class', 'name numericLevel')
    .populate('section', 'name')
    .populate('academicYear', 'name')
    .populate('markedBy', 'username role');
};

// ═════════════════════════════════════════════
// SPECIAL ROUTES — must come before /:id
// ═════════════════════════════════════════════

// ─────────────────────────────────────────────
// GET /attendance/daily
// Returns the class roster + each student's attendance status for a date
// Query: ?class=X&section=Y&academicYear=Z&date=2024-09-15
// ─────────────────────────────────────────────
router.get('/daily', protect, async (req, res) => {
  try {
    const { class: classId, section, academicYear, date } = req.query;

    if (!classId || !section || !academicYear || !date) {
      return res.status(400).json({
        success: false,
        message: 'class, section, academicYear, and date are required',
      });
    }

    // Step 1: get the active enrollments for this class+section+year
    const enrollments = await Enrollment.find({
      class: classId,
      section,
      academicYear,
      status: 'active',
    })
      .populate('student', 'name username regNo admissionNo picture phone')
      .sort({ rollNo: 1 });

    // Step 2: get existing attendance for that date
    const existing = await Attendance.find({
      class: classId,
      section,
      academicYear,
      date,
    });

    // Build a lookup: studentId → attendance record
    const attendanceMap = {};
    existing.forEach((a) => {
      attendanceMap[a.student.toString()] = a;
    });

    // Step 3: merge — each enrollment becomes a row with either the
    // existing attendance or a fresh "unmarked" placeholder
    const rows = enrollments.map((enr) => {
      const att = attendanceMap[enr.student?._id?.toString()];
      return {
        student: enr.student,
        rollNo: enr.rollNo,
        attendanceId: att?._id || null,
        status: att?.status || 'unmarked',
        remarks: att?.remarks || '',
        markedBy: att?.markedBy || null,
      };
    });

    res.status(200).json({
      success: true,
      count: rows.length,
      date,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /attendance/bulk
// Save/update attendance for many students at once (daily marking)
// Body: {
//   class, section, academicYear, date, markedBy,
//   records: [ { student, status, remarks }, ... ]
// }
// ─────────────────────────────────────────────
router.post('/bulk', protect, async (req, res) => {
  try {
    const { class: classId, section, academicYear, date, records } = req.body;

    if (!classId || !section || !academicYear || !date || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'class, section, academicYear, date, and records[] are required',
      });
    }

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'records array is empty',
      });
    }

    const markedBy = req.user?.id || null;
    const saved = [];
    const failed = [];

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (!r.student || !r.status) {
        failed.push({ row: i + 1, reason: 'Missing student or status' });
        continue;
      }
      if (r.status === 'unmarked') {
        // Skip unmarked rows — user didn't touch them
        continue;
      }

      try {
        // Upsert: update if exists, insert if not
        const doc = await Attendance.findOneAndUpdate(
          { student: r.student, date },
          {
            student: r.student,
            class: classId,
            section,
            academicYear,
            date,
            status: r.status,
            remarks: r.remarks || '',
            markedBy,
          },
          { new: true, upsert: true, runValidators: true }
        );
        saved.push(doc);
      } catch (err) {
        failed.push({
          row: i + 1,
          student: r.student,
          reason: err.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Saved ${saved.length} attendance record(s)`,
      savedCount: saved.length,
      failedCount: failed.length,
      failed,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /attendance/report
// Attendance percentage for ONE student over a date range
// Query: ?student=X&from=2024-09-01&to=2024-09-30
// ─────────────────────────────────────────────
router.get('/report', protect, async (req, res) => {
  try {
    const { student: studentId, from, to } = req.query;

    if (!studentId || !from || !to) {
      return res.status(400).json({
        success: false,
        message: 'student, from, and to are required',
      });
    }

    const records = await Attendance.find({
      student: studentId,
      date: { $gte: from, $lte: to },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const leave = records.filter((r) => r.status === 'leave').length;

    // Attendance % counts present + late as attended (both showed up)
    const attended = present + late;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        student: studentId,
        from,
        to,
        total,
        present,
        absent,
        late,
        leave,
        percentage,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /attendance/class-report
// Attendance summary for a class+section over a month
// Query: ?class=X&section=Y&month=2024-09  (month format YYYY-MM)
// ─────────────────────────────────────────────
router.get('/class-report', protect, async (req, res) => {
  try {
    const { class: classId, section, month } = req.query;

    if (!classId || !section || !month) {
      return res.status(400).json({
        success: false,
        message: 'class, section, and month (YYYY-MM) are required',
      });
    }

    const from = `${month}-01`;
    // Compute last day of the month
    const [y, m] = month.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const to = `${month}-${String(lastDay).padStart(2, '0')}`;

    const records = await Attendance.find({
      class: classId,
      section,
      date: { $gte: from, $lte: to },
    }).populate('student', 'name regNo');

    // Aggregate per student
    const byStudent = {};
    records.forEach((r) => {
      const sid = r.student?._id?.toString();
      if (!sid) return;
      if (!byStudent[sid]) {
        byStudent[sid] = {
          student: r.student,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
        };
      }
      byStudent[sid].total += 1;
      byStudent[sid][r.status] += 1;
    });

    // Compute % for each
    const students = Object.values(byStudent).map((s) => {
      const attended = s.present + s.late;
      return {
        ...s,
        percentage: s.total > 0 ? Math.round((attended / s.total) * 100) : 0,
      };
    });

    // Sort by percentage ascending so weakest attendance shows first
    students.sort((a, b) => a.percentage - b.percentage);

    // Whole-class average
    const classAvg =
      students.length > 0
        ? Math.round(
            students.reduce((sum, s) => sum + s.percentage, 0) / students.length
          )
        : 0;

    res.status(200).json({
      success: true,
      month,
      from,
      to,
      classAverage: classAvg,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═════════════════════════════════════════════
// STANDARD CRUD
// ═════════════════════════════════════════════

// ─────────────────────────────────────────────
// CREATE — POST /attendance (any logged-in user)
// ─────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const payload = { ...req.body, markedBy: req.user?.id || null };
    const created = await Attendance.create(payload);
    const populated = await populateAttendance(Attendance.findById(created._id));

    res.status(201).json({
      success: true,
      message: 'Attendance created successfully',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already exists for this student on this date.',
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ALL — GET /attendance
// Filters: ?student= & ?class= & ?section= & ?academicYear= & ?date= & ?status=
//         &from= &to=  (date range)
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    if (req.query.class) filter.class = req.query.class;
    if (req.query.section) filter.section = req.query.section;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.date) filter.date = req.query.date;
    if (req.query.status) filter.status = req.query.status;

    // Date range
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = req.query.from;
      if (req.query.to) filter.date.$lte = req.query.to;
    }

    const records = await populateAttendance(
      Attendance.find(filter).sort({ date: -1, createdAt: -1 })
    );

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ONE — GET /attendance/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const record = await populateAttendance(Attendance.findById(req.params.id));
    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// UPDATE — PUT /attendance/:id (any logged-in user)
// ─────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    const populated = await populateAttendance(Attendance.findById(updated._id));
    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: populated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE — DELETE /attendance/:id (admin only)
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Attendance deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;