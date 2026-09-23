// backend/routes/expenses.js

const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ── Populate helper ────────────────────────────
const populate = (query) =>
  query.populate('recordedBy', 'username role');

// ── Allowed categories (mirrors the model enum) ──
const CATEGORIES = [
  'salary',
  'utilities',
  'internet',
  'rent',
  'maintenance',
  'transport',
  'supplies',
  'sports',
  'events',
  'marketing',
  'legal',
  'charity',
  'other',
];

// ═══════════════════════════════════════════════
// SPECIAL ROUTES (before /:id)
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
// GET /expenses/categories
// Returns the list of valid categories for dropdowns
// ─────────────────────────────────────────────
router.get('/categories', protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: CATEGORIES,
  });
});

// ─────────────────────────────────────────────
// GET /expenses/summary
// Total expenses + per-category breakdown
// Filters: ?from= &to= &category= &department=
// ─────────────────────────────────────────────
router.get('/summary', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = req.query.from;
      if (req.query.to) filter.date.$lte = req.query.to;
    }
    if (req.query.category) filter.category = req.query.category;
    if (req.query.department) filter.department = req.query.department;

    const expenses = await Expense.find(filter);

    const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

    // Group by category
    const byCategory = {};
    expenses.forEach((e) => {
      const cat = e.category || 'other';
      if (!byCategory[cat]) byCategory[cat] = { count: 0, total: 0 };
      byCategory[cat].count += 1;
      byCategory[cat].total += e.amount || 0;
    });

    // Sort categories by total descending
    const categoryList = Object.entries(byCategory)
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.total - a.total);

    res.status(200).json({
      success: true,
      data: {
        count: expenses.length,
        total,
        byCategory: categoryList,
        from: req.query.from || null,
        to: req.query.to || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════════
// STANDARD CRUD
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
// CREATE — POST /expenses (admin only)
// ─────────────────────────────────────────────
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const payload = {
      ...req.body,
      amount: Number(req.body.amount),
      recordedBy: req.user?.id || null,
    };
    const created = await Expense.create(payload);
    const populated = await populate(Expense.findById(created._id));
    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: populated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ALL — GET /expenses
// Filters: ?from= &to= &category= &department= &search=
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = req.query.from;
      if (req.query.to) filter.date.$lte = req.query.to;
    }
    if (req.query.category) filter.category = req.query.category;
    if (req.query.department) filter.department = req.query.department;

    if (req.query.search) {
      const rx = new RegExp(req.query.search, 'i');
      filter.$or = [
        { title: rx },
        { vendor: rx },
        { referenceNo: rx },
        { notes: rx },
      ];
    }

    const expenses = await populate(
      Expense.find(filter).sort({ date: -1, createdAt: -1 })
    );

    const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

    res.status(200).json({
      success: true,
      count: expenses.length,
      total,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ONE — GET /expenses/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const expense = await populate(Expense.findById(req.params.id));
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// UPDATE — PUT /expenses/:id (admin only)
// ─────────────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.amount !== undefined) update.amount = Number(update.amount);

    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    const populated = await populate(Expense.findById(updated._id));
    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: populated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE — DELETE /expenses/:id (admin only)
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;