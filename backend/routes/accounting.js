// backend/routes/accounting.js

const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const FeePayment = require('../models/FeePayment');
const { protect } = require('../middleware/authMiddleware');

// ── Helper: format a Date as "YYYY-MM-DD" ──────
const toISODate = (d) => d.toISOString().split('T')[0];

// ── Helper: first and last day of a month ──────
// month format: "YYYY-MM"
const monthRange = (monthStr) => {
  const [y, m] = monthStr.split('-').map(Number);
  const first = `${monthStr}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const last = `${monthStr}-${String(lastDay).padStart(2, '0')}`;
  return { from: first, to: last };
};

// ── Helper: compute totals for a date range ────
const computeTotals = async (from, to) => {
  const dateFilter = { $gte: from, $lte: to };

  const [income, expenses] = await Promise.all([
    FeePayment.aggregate([
      { $match: { status: 'completed', paymentDate: dateFilter } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: { date: dateFilter } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  const incomeTotal = income[0]?.total || 0;
  const incomeCount = income[0]?.count || 0;
  const expenseTotal = expenses[0]?.total || 0;
  const expenseCount = expenses[0]?.count || 0;

  return {
    income: incomeTotal,
    incomeCount,
    expenses: expenseTotal,
    expenseCount,
    net: incomeTotal - expenseTotal,
  };
};

// ═══════════════════════════════════════════════
// GET /accounting/summary
// Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
// If not provided, defaults to current month.
// ═══════════════════════════════════════════════
router.get('/summary', protect, async (req, res) => {
  try {
    const today = new Date();
    const defaultMonth = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}`;

    const { from, to } = req.query.from && req.query.to
      ? { from: req.query.from, to: req.query.to }
      : monthRange(defaultMonth);

    // ── Compute income & expenses ─────────────────
    const totals = await computeTotals(from, to);

    // ── Expenses by category ──────────────────────
    const expenseByCategory = await Expense.aggregate([
      { $match: { date: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // ── Income by method (bonus) ──────────────────
    const incomeByMethod = await FeePayment.aggregate([
      {
        $match: {
          status: 'completed',
          paymentDate: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: '$method',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        from,
        to,
        totals,
        expenseByCategory: expenseByCategory.map((e) => ({
          category: e._id,
          total: e.total,
          count: e.count,
        })),
        incomeByMethod: incomeByMethod.map((i) => ({
          method: i._id,
          total: i.total,
          count: i.count,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════════
// GET /accounting/monthly
// Query: ?year=2025  (defaults to current year)
// Returns 12 months of income / expenses / net
// ═══════════════════════════════════════════════
router.get('/monthly', protect, async (req, res) => {
  try {
    const today = new Date();
    const year = req.query.year ? Number(req.query.year) : today.getFullYear();

    // Build an array of the 12 months for the year
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const monthStr = `${year}-${String(m).padStart(2, '0')}`;
      const { from, to } = monthRange(monthStr);
      months.push({ month: monthStr, from, to });
    }

    // Compute totals for each month (in parallel)
    const results = await Promise.all(
      months.map(async ({ month, from, to }) => {
        const t = await computeTotals(from, to);
        return { month, ...t };
      })
    );

    // Compute year totals
    const yearTotals = results.reduce(
      (acc, r) => ({
        income: acc.income + r.income,
        expenses: acc.expenses + r.expenses,
        net: acc.net + r.net,
        incomeCount: acc.incomeCount + r.incomeCount,
        expenseCount: acc.expenseCount + r.expenseCount,
      }),
      { income: 0, expenses: 0, net: 0, incomeCount: 0, expenseCount: 0 }
    );

    res.status(200).json({
      success: true,
      data: {
        year,
        months: results,
        yearTotals,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;