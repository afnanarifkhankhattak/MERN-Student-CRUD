// backend/routes/exams.js

const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const ExamSubject = require('../models/ExamSubject');
const ExamResult = require('../models/ExamResult');
const Enrollment = require('../models/Enrollment');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

const populateExam = (query) =>
  query
    .populate('class', 'name numericLevel')
    .populate('academicYear', 'name isActive');

const populateExamSubject = (query) =>
  query
    .populate('exam', 'name examType class academicYear status')
    .populate('subject', 'name code colorHex')
    .populate('teacher', 'name employeeId');

const populateExamResult = (query) =>
  query
    .populate({
      path: 'examSubject',
      populate: [
        { path: 'subject', select: 'name code colorHex' },
        { path: 'exam', select: 'name examType class academicYear status' },
      ],
    })
    .populate('student', 'name username regNo admissionNo picture')
    .populate({
      path: 'enrollment',
      populate: [
        { path: 'class', select: 'name' },
        { path: 'section', select: 'name' },
        { path: 'academicYear', select: 'name' },
      ],
    });

// Letter grade from percentage
function computeGrade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  if (pct >= 40) return 'E';
  return 'F';
}

// ═══════════════════════════════════════════════
// SPECIAL ROUTES (must come before /:id)
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
// GET /exams/:id/full
// Returns an exam with all its subjects + student counts
// ─────────────────────────────────────────────
router.get('/:id/full', protect, async (req, res) => {
  try {
    const exam = await populateExam(Exam.findById(req.params.id));
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const subjects = await ExamSubject.find({ exam: exam._id })
      .populate('subject', 'name code colorHex')
      .populate('teacher', 'name employeeId')
      .sort({ createdAt: 1 });

    // Count results per subject
    const subjectsWithCounts = await Promise.all(
      subjects.map(async (s) => {
        const count = await ExamResult.countDocuments({ examSubject: s._id });
        return {
          ...s.toObject(),
          resultCount: count,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        exam,
        subjects: subjectsWithCounts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /exams/:id/marks-sheet
// Returns the data needed to enter marks:
//   - All subjects in this exam
//   - All active students in a class+section (from Enrollment)
//   - Existing results for those students (if any)
// Query: ?section=<sectionId>
// ─────────────────────────────────────────────
router.get('/:id/marks-sheet', protect, async (req, res) => {
  try {
    const { section } = req.query;
    if (!section) {
      return res.status(400).json({
        success: false,
        message: 'section query param is required',
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Get subjects for this exam
    const subjects = await ExamSubject.find({ exam: exam._id })
      .populate('subject', 'name code colorHex')
      .sort({ createdAt: 1 });

    // Get active enrollments for this class+section+year
    const enrollments = await Enrollment.find({
      class: exam.class,
      section,
      academicYear: exam.academicYear,
      status: 'active',
    })
      .populate('student', 'name regNo admissionNo picture')
      .sort({ rollNo: 1 });

    // Get all existing results for these subjects (any student)
    const subjectIds = subjects.map((s) => s._id);
    const existingResults = await ExamResult.find({
      examSubject: { $in: subjectIds },
    });

    // Build a nested lookup: { studentId: { subjectId: resultObj } }
    const resultLookup = {};
    existingResults.forEach((r) => {
      const sid = r.student.toString();
      const esid = r.examSubject.toString();
      if (!resultLookup[sid]) resultLookup[sid] = {};
      resultLookup[sid][esid] = {
        _id: r._id,
        obtainedMarks: r.obtainedMarks,
        isAbsent: r.isAbsent,
        remarks: r.remarks,
      };
    });

    // Compose the rows: each student with their subject-wise results
    const rows = enrollments.map((enr) => ({
      enrollmentId: enr._id,
      rollNo: enr.rollNo,
      student: enr.student,
      results: subjects.map((s) => ({
        examSubjectId: s._id,
        subject: s.subject,
        totalMarks: s.totalMarks,
        passingMarks: s.passingMarks,
        obtainedMarks:
          resultLookup[enr.student?._id?.toString()]?.[s._id.toString()]
            ?.obtainedMarks ?? '',
        isAbsent:
          resultLookup[enr.student?._id?.toString()]?.[s._id.toString()]
            ?.isAbsent ?? false,
        remarks:
          resultLookup[enr.student?._id?.toString()]?.[s._id.toString()]
            ?.remarks ?? '',
        resultId:
          resultLookup[enr.student?._id?.toString()]?.[s._id.toString()]?._id ||
          null,
      })),
    }));

    res.status(200).json({
      success: true,
      data: {
        exam,
        subjects,
        rows,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /exams/:id/bulk-marks
// Save/update many students' marks for one subject
// Body: {
//   examSubject: <id>,
//   records: [
//     { student, enrollment, obtainedMarks, isAbsent, remarks }, ...
//   ]
// }
// ─────────────────────────────────────────────
router.post('/:id/bulk-marks', protect, async (req, res) => {
  try {
    const { examSubject, records } = req.body;

    if (!examSubject || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'examSubject and records[] are required',
      });
    }

    // Validate examSubject belongs to this exam
    const es = await ExamSubject.findOne({ _id: examSubject, exam: req.params.id });
    if (!es) {
      return res.status(400).json({
        success: false,
        message: 'ExamSubject not found for this exam',
      });
    }

    const saved = [];
    const failed = [];

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (!r.student) {
        failed.push({ row: i + 1, reason: 'Missing student' });
        continue;
      }
      const isAbsent = !!r.isAbsent;
      const obtained = isAbsent ? 0 : Number(r.obtainedMarks);

      if (!isAbsent && (isNaN(obtained) || obtained < 0)) {
        failed.push({ row: i + 1, reason: 'Invalid marks' });
        continue;
      }
      if (obtained > es.totalMarks) {
        failed.push({
          row: i + 1,
          reason: `Marks exceed total (${es.totalMarks})`,
        });
        continue;
      }

      try {
        const doc = await ExamResult.findOneAndUpdate(
          { examSubject, student: r.student },
          {
            examSubject,
            student: r.student,
            enrollment: r.enrollment || null,
            obtainedMarks: obtained,
            isAbsent,
            remarks: r.remarks || '',
          },
          { new: true, upsert: true, runValidators: true }
        );
        saved.push(doc);
      } catch (err) {
        failed.push({ row: i + 1, student: r.student, reason: err.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Saved ${saved.length} result(s)`,
      savedCount: saved.length,
      failedCount: failed.length,
      failed,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /exams/:id/rankings
// Class rankings for a section, with positions
// Query: ?section=<sectionId>
// ─────────────────────────────────────────────
router.get('/:id/rankings', protect, async (req, res) => {
  try {
    const { section } = req.query;
    if (!section) {
      return res.status(400).json({
        success: false,
        message: 'section query param is required',
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Get all subjects in the exam
    const subjects = await ExamSubject.find({ exam: exam._id });
    const subjectIds = subjects.map((s) => s._id);

    // Compute totalMarks across all subjects
    const grandTotal = subjects.reduce((sum, s) => sum + s.totalMarks, 0);

    // Get all results for these subjects
    const results = await ExamResult.find({
      examSubject: { $in: subjectIds },
    })
      .populate('student', 'name regNo picture')
      .populate('enrollment', 'rollNo section class');

    // Group by student → sum obtained
    const byStudent = {};
    results.forEach((r) => {
      const sid = r.student?._id?.toString();
      if (!sid) return;
      if (!byStudent[sid]) {
        byStudent[sid] = {
          student: r.student,
          enrollment: r.enrollment,
          totalObtained: 0,
          subjectCount: 0,
          absentCount: 0,
        };
      }
      byStudent[sid].totalObtained += r.obtainedMarks;
      byStudent[sid].subjectCount += 1;
      if (r.isAbsent) byStudent[sid].absentCount += 1;
    });

    // Only include students in the given section
    const rankings = Object.values(byStudent)
      .filter((r) => r.enrollment?.section?.toString() === section)
      .map((r) => {
        const percentage =
          grandTotal > 0
            ? Math.round((r.totalObtained / grandTotal) * 100 * 100) / 100
            : 0;
        return {
          ...r,
          totalMarks: grandTotal,
          percentage,
          grade: computeGrade(percentage),
        };
      })
      .sort((a, b) => b.totalObtained - a.totalObtained);

    // Assign positions (ties get the same position)
    let lastMarks = null;
    let lastPos = 0;
    rankings.forEach((r, idx) => {
      if (r.totalObtained === lastMarks) {
        r.position = lastPos;
      } else {
        r.position = idx + 1;
        lastPos = r.position;
        lastMarks = r.totalObtained;
      }
    });

    res.status(200).json({
      success: true,
      count: rankings.length,
      grandTotal,
      data: rankings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /exams/student/:studentId/report-card
// Full report card data for a student in an exam
// Query: ?exam=<examId>
// ─────────────────────────────────────────────
router.get('/student/:studentId/report-card', protect, async (req, res) => {
  try {
    const { exam: examId } = req.query;
    if (!examId) {
      return res.status(400).json({
        success: false,
        message: 'exam query param is required',
      });
    }

    const exam = await populateExam(Exam.findById(examId));
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Get all subjects for this exam
    const subjects = await ExamSubject.find({ exam: examId })
      .populate('subject', 'name code colorHex')
      .sort({ createdAt: 1 });

    const subjectIds = subjects.map((s) => s._id);

    // Get the student's results
    const results = await ExamResult.find({
      examSubject: { $in: subjectIds },
      student: req.params.studentId,
    });

    // Build a lookup by examSubject
    const resultMap = {};
    results.forEach((r) => {
      resultMap[r.examSubject.toString()] = r;
    });

    // Compose the report card rows
    const subjectRows = subjects.map((s) => {
      const r = resultMap[s._id.toString()];
      const obtained = r?.obtainedMarks ?? 0;
      const isAbsent = r?.isAbsent ?? false;
      const percentage =
        s.totalMarks > 0
          ? Math.round((obtained / s.totalMarks) * 100 * 100) / 100
          : 0;
      return {
        examSubjectId: s._id,
        subject: s.subject,
        teacher: s.teacher,
        totalMarks: s.totalMarks,
        passingMarks: s.passingMarks,
        obtainedMarks: isAbsent ? 0 : obtained,
        isAbsent,
        remarks: r?.remarks || '',
        percentage,
        grade: isAbsent ? 'AB' : computeGrade(percentage),
        isPassed: !isAbsent && obtained >= s.passingMarks,
      };
    });

    const totalMarks = subjects.reduce((sum, s) => sum + s.totalMarks, 0);
    const totalObtained = subjectRows.reduce(
      (sum, r) => sum + r.obtainedMarks,
      0
    );
    const overallPercentage =
      totalMarks > 0
        ? Math.round((totalObtained / totalMarks) * 100 * 100) / 100
        : 0;

    // Get the student + enrollment info
    const studentResult = results[0];
    let enrollmentInfo = null;
    if (studentResult?.enrollment) {
      enrollmentInfo = await Enrollment.findById(studentResult.enrollment)
        .populate('class', 'name')
        .populate('section', 'name')
        .populate('academicYear', 'name');
    }

    // Fetch the student to display their name, etc.
    const Student = require('../models/Student');
    const student = await Student.findById(req.params.studentId);

    res.status(200).json({
      success: true,
      data: {
        exam,
        student,
        enrollment: enrollmentInfo,
        subjects: subjectRows,
        summary: {
          totalMarks,
          totalObtained,
          overallPercentage,
          overallGrade: computeGrade(overallPercentage),
          isPassed: subjectRows.every((r) => r.isPassed),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════════
// EXAM CRUD
// ═══════════════════════════════════════════════

router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const created = await Exam.create(req.body);
    const populated = await populateExam(Exam.findById(created._id));
    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An exam with this name already exists for this class and year.',
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.class) filter.class = req.query.class;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.examType) filter.examType = req.query.examType;

    const exams = await populateExam(
      Exam.find(filter).sort({ createdAt: -1 })
    );

    res.status(200).json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const exam = await populateExam(Exam.findById(req.params.id));
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const updated = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    const populated = await populateExam(Exam.findById(updated._id));
    res.status(200).json({
      success: true,
      message: 'Exam updated successfully',
      data: populated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    // Cascading delete: remove ExamSubjects and ExamResults
    const subjects = await ExamSubject.find({ exam: req.params.id });
    const subjectIds = subjects.map((s) => s._id);

    await ExamResult.deleteMany({ examSubject: { $in: subjectIds } });
    await ExamSubject.deleteMany({ exam: req.params.id });

    const deleted = await Exam.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Exam and all related subjects & results deleted',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════════
// EXAM SUBJECT CRUD
// ═══════════════════════════════════════════════

router.post('/:id/subjects', protect, requireRole('admin'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    const created = await ExamSubject.create({
      ...req.body,
      exam: req.params.id,
    });
    const populated = await populateExamSubject(
      ExamSubject.findById(created._id)
    );
    res.status(201).json({
      success: true,
      message: 'Exam subject added',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This subject is already part of this exam.',
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/subjects/:subjectId', protect, requireRole('admin'), async (req, res) => {
  try {
    const updated = await ExamSubject.findByIdAndUpdate(
      req.params.subjectId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Exam subject not found' });
    }
    const populated = await populateExamSubject(
      ExamSubject.findById(updated._id)
    );
    res.status(200).json({
      success: true,
      message: 'Exam subject updated',
      data: populated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/subjects/:subjectId', protect, requireRole('admin'), async (req, res) => {
  try {
    // Cascade: delete all results for this exam subject
    await ExamResult.deleteMany({ examSubject: req.params.subjectId });
    const deleted = await ExamSubject.findByIdAndDelete(req.params.subjectId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Exam subject not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Exam subject and its results deleted',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;