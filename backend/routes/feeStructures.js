// backend/routes/feeStructures.js

const express = require('express');
const router = express.Router();
const FeeStructure = require('../models/FeeStructure');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ── Populate helper ────────────────────────────
const populate = (query) =>
  query
    .populate('class', 'name numericLevel')
    .populate('academicYear', 'name isActive');

// ── Helper: recompute totals from heads ────────
// Needed for update routes (pre-save hook doesn't run on findByIdAndUpdate)
const computeTotals = (heads) => {
  let monthly = 0;
  let oneTime = 0;
  (heads || []).forEach((h) => {
    if (h.frequency === 'monthly') monthly += Number(h.amount) || 0;
    else if (h.frequency === 'one-time') oneTime += Number(h.amount) || 0;
  });
  return { totalMonthly: monthly, totalOneTime: oneTime };
};

// ─────────────────────────────────────────────
// CREATE — POST /fee-structures (admin only)
// ─────────────────────────────────────────────
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { totalMonthly, totalOneTime } = computeTotals(req.body.heads);
    const created = await FeeStructure.create({
      ...req.body,
      totalMonthly,
      totalOneTime,
    });
    const populated = await populate(FeeStructure.findById(created._id));
    res.status(201).json({
      success: true,
      message: 'Fee structure created successfully',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          'A fee structure with this name already exists for this class and year.',
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ALL — GET /fee-structures
// Filters: ?class= &academicYear= &isActive=
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.class) filter.class = req.query.class;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const structures = await populate(
      FeeStructure.find(filter).sort({ createdAt: -1 })
    );

    res.status(200).json({
      success: true,
      count: structures.length,
      data: structures,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ONE — GET /fee-structures/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const fs = await populate(FeeStructure.findById(req.params.id));
    if (!fs) {
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }
    res.status(200).json({ success: true, data: fs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// UPDATE — PUT /fee-structures/:id (admin only)
// ─────────────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.heads) {
      const { totalMonthly, totalOneTime } = computeTotals(update.heads);
      update.totalMonthly = totalMonthly;
      update.totalOneTime = totalOneTime;
    }

    const updated = await FeeStructure.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }
    const populated = await populate(FeeStructure.findById(updated._id));
    res.status(200).json({
      success: true,
      message: 'Fee structure updated successfully',
      data: populated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE — DELETE /fee-structures/:id (admin only)
// Prevent delete if invoices reference it
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const FeeInvoice = require('../models/FeeInvoice');
    const usedCount = await FeeInvoice.countDocuments({
      generatedFrom: req.params.id,
    });
    if (usedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete — ${usedCount} invoice(s) were generated from this structure. Deactivate it instead.`,
      });
    }

    const deleted = await FeeStructure.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Fee structure deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;