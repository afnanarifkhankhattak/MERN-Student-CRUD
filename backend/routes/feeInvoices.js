// backend/routes/feeInvoices.js

const express = require('express');
const router = express.Router();
const FeeInvoice = require('../models/FeeInvoice');
const FeeStructure = require('../models/FeeStructure');
const FeePayment = require('../models/FeePayment');
const Enrollment = require('../models/Enrollment');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ── Populate helper ────────────────────────────
const populate = (query) =>
  query
    .populate('student', 'name username regNo admissionNo picture phone')
    .populate('class', 'name numericLevel')
    .populate('academicYear', 'name')
    .populate({
      path: 'enrollment',
      populate: [
        { path: 'section', select: 'name' },
        { path: 'class', select: 'name' },
      ],
    })
    .populate('generatedFrom', 'name')
    .populate('generatedBy', 'username role');

// ── Helper: recompute status ───────────────────
const computeStatus = (invoice) => {
  if (invoice.status === 'waived') return 'waived';
  if (invoice.paidAmount >= invoice.totalAmount) return 'paid';
  if (invoice.paidAmount > 0) return 'partial';
  // Overdue check happens on the client — we always store 'unpaid' if nothing paid
  return 'unpaid';
};

// ── Helper: generate invoice number ────────────
// Sequential per year, format: INV-2025-0001
const generateInvoiceNo = async () => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last = await FeeInvoice.findOne(
    { invoiceNo: new RegExp(`^${prefix}`) },
    { invoiceNo: 1 }
  ).sort({ invoiceNo: -1 });

  let nextSeq = 1;
  if (last && last.invoiceNo) {
    const num = parseInt(last.invoiceNo.replace(prefix, ''), 10);
    if (!isNaN(num)) nextSeq = num + 1;
  }
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
};

// ═══════════════════════════════════════════════
// SPECIAL ROUTES (before /:id)
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
// POST /fee-invoices/generate-bulk
// Generate invoices for all students in a class+period
// Body: { class, academicYear, period, periodLabel, dueDate, feeStructureId, section? }
// ─────────────────────────────────────────────
router.post('/generate-bulk', protect, requireRole('admin'), async (req, res) => {
  try {
    const {
      class: classId,
      academicYear,
      period,
      periodLabel,
      dueDate,
      feeStructureId,
      section,
    } = req.body;

    if (!classId || !academicYear || !period || !dueDate || !feeStructureId) {
      return res.status(400).json({
        success: false,
        message:
          'class, academicYear, period, dueDate, and feeStructureId are required',
      });
    }

    // Load the fee structure
    const structure = await FeeStructure.findById(feeStructureId);
    if (!structure) {
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }

    // Get all active enrollments for the class (+ optional section)
    const enrFilter = { class: classId, academicYear, status: 'active' };
    if (section) enrFilter.section = section;
    const enrollments = await Enrollment.find(enrFilter);

    if (enrollments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active students found for the given class/section/year.',
      });
    }

    // Build line items from fee structure's non-optional heads
    const buildLineItems = () =>
      structure.heads
        .filter((h) => !h.isOptional)
        .map((h) => ({
          head: h.head,
          amount: h.amount,
          frequency: h.frequency,
          description: h.description || '',
        }));

    const inserted = [];
    const skipped = [];
    const failed = [];

    const userId = req.user?.id || null;

    for (const enr of enrollments) {
      try {
        // Check for existing invoice (student + period + year)
        const existing = await FeeInvoice.findOne({
          student: enr.student,
          period,
          academicYear,
        });
        if (existing) {
          skipped.push({
            student: enr.student,
            reason: 'Invoice already exists for this period',
          });
          continue;
        }

        const lineItems = buildLineItems();
        const subtotal = lineItems.reduce((s, li) => s + li.amount, 0);

        const invoiceNo = await generateInvoiceNo();

        const created = await FeeInvoice.create({
          student: enr.student,
          enrollment: enr._id,
          class: classId,
          academicYear,
          period,
          periodLabel: periodLabel || period,
          invoiceNo,
          lineItems,
          subtotal,
          discount: 0,
          lateFee: 0,
          totalAmount: subtotal,
          paidAmount: 0,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate,
          status: 'unpaid',
          generatedFrom: feeStructureId,
          generatedBy: userId,
        });
        inserted.push(created._id);
      } catch (err) {
        failed.push({ student: enr.student, reason: err.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Generated ${inserted.length} invoice(s)`,
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      failedCount: failed.length,
      skipped,
      failed,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /fee-invoices/summary
// Dashboard summary: billed, collected, outstanding, overdue count
// Filters: ?class= &academicYear= &period=
// ─────────────────────────────────────────────
router.get('/summary', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.class) filter.class = req.query.class;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.period) filter.period = req.query.period;

    const invoices = await FeeInvoice.find(filter);

    const billed = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const collected = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const outstanding = Math.max(0, billed - collected);

    const today = new Date().toISOString().split('T')[0];
    const overdueCount = invoices.filter(
      (i) => i.status !== 'paid' && i.status !== 'waived' && i.dueDate && i.dueDate < today
    ).length;

    const byStatus = {
      unpaid: invoices.filter((i) => i.status === 'unpaid').length,
      partial: invoices.filter((i) => i.status === 'partial').length,
      paid: invoices.filter((i) => i.status === 'paid').length,
      overdue: overdueCount,
      waived: invoices.filter((i) => i.status === 'waived').length,
    };

    res.status(200).json({
      success: true,
      data: {
        count: invoices.length,
        billed,
        collected,
        outstanding,
        byStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════════
// STANDARD CRUD
// ═══════════════════════════════════════════════

router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const invoiceNo = req.body.invoiceNo || (await generateInvoiceNo());
    const lineItems = req.body.lineItems || [];
    const subtotal = lineItems.reduce((s, li) => s + (Number(li.amount) || 0), 0);
    const discount = Number(req.body.discount) || 0;
    const lateFee = Number(req.body.lateFee) || 0;
    const totalAmount = subtotal - discount + lateFee;

    const created = await FeeInvoice.create({
      ...req.body,
      invoiceNo,
      lineItems,
      subtotal,
      discount,
      lateFee,
      totalAmount,
      paidAmount: 0,
      status: 'unpaid',
      generatedBy: req.user?.id || null,
    });
    const populated = await populate(FeeInvoice.findById(created._id));
    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An invoice already exists for this student and period.',
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    if (req.query.class) filter.class = req.query.class;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.period) filter.period = req.query.period;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from || req.query.to) {
      filter.dueDate = {};
      if (req.query.from) filter.dueDate.$gte = req.query.from;
      if (req.query.to) filter.dueDate.$lte = req.query.to;
    }

    const invoices = await populate(
      FeeInvoice.find(filter).sort({ createdAt: -1 })
    );

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const invoice = await populate(FeeInvoice.findById(req.params.id));
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    // Also fetch payments for this invoice
    const payments = await FeePayment.find({ invoice: invoice._id })
      .populate('receivedBy', 'username')
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        invoice,
        payments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const update = { ...req.body };

    // If line items changed, recompute subtotal + total
    if (update.lineItems) {
      update.subtotal = update.lineItems.reduce(
        (s, li) => s + (Number(li.amount) || 0),
        0
      );
    }
    const subtotal = update.subtotal ?? null;
    const discount = update.discount ?? null;
    const lateFee = update.lateFee ?? null;

    // Recompute totalAmount only if we have the inputs
    if (subtotal !== null || discount !== null || lateFee !== null) {
      const invoice = await FeeInvoice.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }
      const s = subtotal ?? invoice.subtotal;
      const d = discount ?? invoice.discount;
      const l = lateFee ?? invoice.lateFee;
      update.totalAmount = s - d + l;
      // Recompute status
      const newPaid = invoice.paidAmount;
      if (invoice.status !== 'waived') {
        if (newPaid >= update.totalAmount) update.status = 'paid';
        else if (newPaid > 0) update.status = 'partial';
        else update.status = 'unpaid';
      }
    }

    const updated = await FeeInvoice.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    const populated = await populate(FeeInvoice.findById(updated._id));
    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: populated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    // Prevent delete if payments exist
    const payCount = await FeePayment.countDocuments({ invoice: req.params.id });
    if (payCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete — ${payCount} payment(s) exist for this invoice. Delete the payments first.`,
      });
    }

    const deleted = await FeeInvoice.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;