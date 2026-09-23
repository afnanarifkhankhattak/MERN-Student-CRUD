// backend/routes/timetable.js

const express = require('express');
const router = express.Router();
const TimetableEntry = require('../models/TimetableEntry');
const Period = require('../models/Period');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ── Populate helper ────────────────────────────
const populate = (query) =>
  query
    .populate('class', 'name numericLevel')
    .populate('section', 'name')
    .populate('academicYear', 'name isActive')
    .populate('period', 'name order startTime endTime isBreak')
    .populate('subject', 'name code colorHex')
    .populate('teacher', 'name employeeId');

// ── Days in order ──────────────────────────────
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// ─────────────────────────────────────────────
// HELPER: check for teacher / room conflicts
// Returns { conflict: bool, reason: string }
// ─────────────────────────────────────────────
const checkConflicts = async ({
  teacher,
  room,
  day,
  period,
  academicYear,
  excludeId = null,
}) => {
  // Teacher conflict
  if (teacher) {
    const teacherQuery = {
      teacher,
      day,
      period,
      academicYear,
    };
    if (excludeId) teacherQuery._id = { $ne: excludeId };
    const teacherConflict = await TimetableEntry.findOne(teacherQuery).populate(
      'class',
      'name'
    );
    if (teacherConflict) {
      return {
        conflict: true,
        reason: `Teacher is already assigned to ${teacherConflict.class?.name} on ${day} at this period.`,
      };
    }
  }

  // Room conflict
  if (room && room.trim()) {
    const roomQuery = {
      room: room.trim(),
      day,
      period,
      academicYear,
    };
    if (excludeId) roomQuery._id = { $ne: excludeId };
    const roomConflict = await TimetableEntry.findOne(roomQuery).populate(
      'class',
      'name'
    );
    if (roomConflict) {
      return {
        conflict: true,
        reason: `Room "${room}" is already booked for ${roomConflict.class?.name} on ${day} at this period.`,
      };
    }
  }

  return { conflict: false, reason: '' };
};

// ═══════════════════════════════════════════════
// SPECIAL ROUTES (before /:id)
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
// GET /timetable/grid
// Full week grid for a class + section + year
// Query: ?class= &section= &academicYear=
// ─────────────────────────────────────────────
router.get('/grid', protect, async (req, res) => {
  try {
    const { class: classId, section, academicYear } = req.query;
    if (!classId || !section || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'class, section, and academicYear are required',
      });
    }

    // Fetch all periods (ordered)
    const periods = await Period.find({ isActive: true }).sort({ order: 1 });

    // Fetch all entries for this class+section+year
    const entries = await populate(
      TimetableEntry.find({
        class: classId,
        section,
        academicYear,
      })
    );

    // Build a grid: { [day]: { [periodId]: entry } }
    const grid = {};
    DAYS.forEach((d) => (grid[d] = {}));
    entries.forEach((e) => {
      grid[e.day][e.period._id] = e;
    });

    res.status(200).json({
      success: true,
      data: {
        periods,
        days: DAYS,
        grid,
        totalEntries: entries.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /timetable/teacher/:teacherId
// A teacher's full week schedule
// Query: ?academicYear=  (optional)
// ─────────────────────────────────────────────
router.get('/teacher/:teacherId', protect, async (req, res) => {
  try {
    const filter = { teacher: req.params.teacherId };
    if (req.query.academicYear) {
      filter.academicYear = req.query.academicYear;
    }

    const entries = await populate(
      TimetableEntry.find(filter).sort({ day: 1 })
    );

    // Group by day
    const byDay = {};
    DAYS.forEach((d) => (byDay[d] = []));
    entries.forEach((e) => {
      if (byDay[e.day]) byDay[e.day].push(e);
    });

    res.status(200).json({
      success: true,
      data: {
        days: DAYS,
        byDay,
        totalEntries: entries.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /timetable/bulk
// Save an entire grid at once (upsert each cell)
// Body: {
//   class, section, academicYear,
//   entries: [
//     { day, period, subject, teacher, room, notes, _id? }, ...
//   ]
// }
// ─────────────────────────────────────────────
router.post('/bulk', protect, requireRole('admin'), async (req, res) => {
  try {
    const { class: classId, section, academicYear, entries } = req.body;

    if (!classId || !section || !academicYear || !Array.isArray(entries)) {
      return res.status(400).json({
        success: false,
        message: 'class, section, academicYear, and entries[] are required',
      });
    }

    const saved = [];
    const failed = [];

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (!e.day || !e.period) {
        failed.push({ row: i + 1, reason: 'Missing day or period' });
        continue;
      }

      // Conflict check
      const conflict = await checkConflicts({
        teacher: e.teacher || null,
        room: e.room || '',
        day: e.day,
        period: e.period,
        academicYear,
        excludeId: e._id || null,
      });
      if (conflict.conflict) {
        failed.push({ row: i + 1, reason: conflict.reason });
        continue;
      }

      try {
        // Upsert: find by class+section+year+day+period, then update or create
        const doc = await TimetableEntry.findOneAndUpdate(
          {
            class: classId,
            section,
            academicYear,
            day: e.day,
            period: e.period,
          },
          {
            class: classId,
            section,
            academicYear,
            day: e.day,
            period: e.period,
            subject: e.subject || null,
            teacher: e.teacher || null,
            room: e.room || '',
            notes: e.notes || '',
          },
          { new: true, upsert: true, runValidators: true }
        );
        saved.push(doc);
      } catch (err) {
        failed.push({ row: i + 1, reason: err.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Saved ${saved.length} entries`,
      savedCount: saved.length,
      failedCount: failed.length,
      failed,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /timetable/copy
// Copy all entries from one class+section+year to another
// Body: { fromClass, fromSection, fromYear, toClass, toSection, toYear }
// ─────────────────────────────────────────────
router.post('/copy', protect, requireRole('admin'), async (req, res) => {
  try {
    const { fromClass, fromSection, fromYear, toClass, toSection, toYear } =
      req.body;

    if (!fromClass || !fromSection || !fromYear || !toClass || !toSection || !toYear) {
      return res.status(400).json({
        success: false,
        message: 'All source and target references are required',
      });
    }

    const sourceEntries = await TimetableEntry.find({
      class: fromClass,
      section: fromSection,
      academicYear: fromYear,
    });

    if (sourceEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Source timetable has no entries.',
      });
    }

    // Delete existing target entries (overwrite)
    await TimetableEntry.deleteMany({
      class: toClass,
      section: toSection,
      academicYear: toYear,
    });

    const newEntries = sourceEntries.map((e) => ({
      class: toClass,
      section: toSection,
      academicYear: toYear,
      day: e.day,
      period: e.period,
      subject: e.subject,
      teacher: e.teacher,
      room: e.room,
      notes: e.notes,
    }));

    const inserted = await TimetableEntry.insertMany(newEntries);

    res.status(201).json({
      success: true,
      message: `Copied ${inserted.length} entries`,
      insertedCount: inserted.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════════
// STANDARD CRUD
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
// CREATE — POST /timetable (admin only)
// ─────────────────────────────────────────────
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { class: classId, section, academicYear, day, period, teacher, room } = req.body;

    // Conflict check
    const conflict = await checkConflicts({
      teacher: teacher || null,
      room: room || '',
      day,
      period,
      academicYear,
    });
    if (conflict.conflict) {
      return res.status(400).json({
        success: false,
        message: conflict.reason,
      });
    }

    const created = await TimetableEntry.create(req.body);
    const populated = await populate(TimetableEntry.findById(created._id));

    res.status(201).json({
      success: true,
      message: 'Timetable entry created successfully',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This class already has a subject assigned at this period on this day.',
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ALL — GET /timetable
// Filters: ?class= &section= &academicYear= &teacher= &day= &room=
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.class) filter.class = req.query.class;
    if (req.query.section) filter.section = req.query.section;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.teacher) filter.teacher = req.query.teacher;
    if (req.query.day) filter.day = req.query.day;
    if (req.query.room) filter.room = req.query.room;

    const entries = await populate(TimetableEntry.find(filter).sort({ day: 1 }));

    res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ONE — GET /timetable/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const entry = await populate(TimetableEntry.findById(req.params.id));
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    }
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// UPDATE — PUT /timetable/:id (admin only)
// ─────────────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const existing = await TimetableEntry.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    }

    const day = req.body.day || existing.day;
    const period = req.body.period || existing.period;
    const teacher = req.body.teacher !== undefined ? req.body.teacher : existing.teacher;
    const room = req.body.room !== undefined ? req.body.room : existing.room;

    // Conflict check (excluding this entry)
    const conflict = await checkConflicts({
      teacher,
      room,
      day,
      period,
      academicYear: existing.academicYear,
      excludeId: req.params.id,
    });
    if (conflict.conflict) {
      return res.status(400).json({
        success: false,
        message: conflict.reason,
      });
    }

    const updated = await TimetableEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    const populated = await populate(TimetableEntry.findById(updated._id));

    res.status(200).json({
      success: true,
      message: 'Timetable entry updated successfully',
      data: populated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE — DELETE /timetable/:id (admin only)
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await TimetableEntry.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Timetable entry deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;